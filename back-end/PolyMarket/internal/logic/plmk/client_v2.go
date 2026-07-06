//go:build ignore

package plmk

// client_v2.go 提供与 py-clob-client-v2 等价的 V2 客户端方法:
//   - 服务器版本探测与缓存
//   - CTF Exchange V2 订单的创建/签名/提交
//   - market_by_token / clob_markets 缓存
//   - builder API key / builder fee rate
//   - rewards / pre-migration orders / prices-history

import (
	_ "context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"math/big"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/zedili/Polymarket-golang/polymarket"

	obuilder "github.com/zedili/Polymarket-golang/polymarket/order_builder"
)

// ============================================================
//  公共 setter / getter
// ============================================================

// SetBuilderConfig 设置全局 builder 配置(builder_address + builder_code)。
// 若订单参数自己提供了 builder_code 则优先使用参数,否则使用此配置。
//
// 内部存一份 copy,避免外部 mutate 同一指针导致下单时拿到部分写入的状态。
// 传 nil 表示清空。
func (c *ClobClient) SetBuilderConfig(cfg *polymarket.BuilderConfig) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if cfg == nil {
		c.builderConfig = nil
		return
	}
	clone := *cfg
	c.builderConfig = &clone
}

// GetBuilderConfig 返回当前 builder 配置的 **副本**(无配置返回 nil)。
// 副本保证调用方拿到的对象与 SDK 内部状态完全脱钩,可以放心读写。
func (c *ClobClient) GetBuilderConfig() *polymarket.BuilderConfig {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.builderConfig == nil {
		return nil
	}
	clone := *c.builderConfig
	return &clone
}

// defaultBuilderCode 返回当前全局 builder code,加 RLock 安全读 + 返回 string 副本。
// 在 CreateOrderV2 / CreateMarketOrderV2 里用它替代直接读 c.builderConfig.BuilderCode。
func (c *ClobClient) defaultBuilderCode() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if c.builderConfig == nil {
		return ""
	}
	return c.builderConfig.BuilderCode
}

// GetSigType 返回 V2 签名类型(0 EOA / 1 Proxy / 2 Safe / 3 POLY_1271)。
func (c *ClobClient) GetSigType() int { return c.sigType }

// GetFunder 返回资金持有者地址(对 POLY_1271 即 Deposit Wallet 地址)。
func (c *ClobClient) GetFunder() string { return c.funder }

// ChainID 返回 chain id。
func (c *ClobClient) ChainID() int { return c.chainID }

// SetFeeSlippage 设置平台费率上浮百分比(0 或 [1,100])。
// 与 py-clob-client-v2.fee_slippage 一致 —— 用于 adjust_buy_amount_for_fees
// 时在平台费上加一层安全垫,避免上链时实际费用大于预期。
func (c *ClobClient) SetFeeSlippage(percent float64) error {
	if err := polymarket.ValidateFeeSlippage(percent); err != nil {
		return err
	}
	c.mu.Lock()
	c.feeSlippage = percent
	c.mu.Unlock()
	return nil
}

// GetFeeSlippage 当前的费率上浮百分比。
func (c *ClobClient) GetFeeSlippage() float64 {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.feeSlippage
}

// SetRetryConfig 设置 HTTP 客户端的重试策略。默认策略:
//   - GET 上 429/5xx/net err 最多重试 3 次,指数退避 200ms → 3s
//   - POST/PUT/DELETE 不重试(防 PostOrder 重复下单)
//
// 把 cfg.RetryNonIdempotent 设为 true 才会重试 POST。
func (c *ClobClient) SetRetryConfig(cfg polymarket.RetryConfig) {
	c.httpClient.SetRetryConfig(cfg)
}

// SetRequestTimeout 单次 HTTP 请求最长等待。0 表示用 http.Client.Timeout (默认 30s)。
// 这是机器人场景的"快速失败" knob —— 设 2s 后,一个慢请求会立刻失败、走重试,
// 而不是阻塞 30s。
func (c *ClobClient) SetRequestTimeout(d time.Duration) {
	c.httpClient.SetRequestTimeout(d)
}

// adjustBuyAmountForBalance 对应 py-clob-client-v2._adjust_buy_amount_for_balance。
// 仅在 BUY 单且 user_usdc_balance 非空时调用。返回调整后的 maker amount(USDC)。
//
// 安全约束:fee_info 必须命中。若市场详情拉取失败(GetClobMarketInfo 错误)
// 或返回的 tokens 不包含本 token,则不能默默把 fee 当 0,否则余额保护会
// 把订单签得超出实际可承担费用。
func (c *ClobClient) adjustBuyAmountForBalance(tokenID string, amount, price, userUsdcBalance float64, builderCode string) (float64, error) {
	if err := c.ensureMarketInfoCached(tokenID); err != nil {
		return 0, err
	}
	c.mu.RLock()
	fi := c.feeInfos[tokenID]
	slip := c.feeSlippage
	c.mu.RUnlock()
	if fi == nil {
		// market 详情看似拉到了但缺这个 token 的 fee_info,拒绝继续。
		return 0, fmt.Errorf("missing fee info for token %s; cannot safely adjust buy amount for balance", tokenID)
	}

	takerFee := 0.0
	if builderCode != "" && builderCode != polymarket.Bytes32Zero {
		rate, err := c.GetBuilderFeeRate(builderCode)
		if err != nil {
			return 0, fmt.Errorf("failed to fetch builder fee rate for %s: %w", builderCode, err)
		}
		takerFee = rate.Taker
	}
	return polymarket.AdjustBuyAmountForFees(amount, price, userUsdcBalance, fi.Rate, fi.Exponent, takerFee, slip)
}

// ============================================================
//  版本探测
// ============================================================

// GetVersion 询问服务器当前订单合约版本(1 或 2)。
//
// 对齐 py-clob-client-v2.get_version:任何错误(网络、JSON 异常、字段缺失)
// 都默认返回 OrderVersionV2,不向上抛错。这样 SDK 在 V2-only 部署或临时
// 服务降级时仍能下单。
func (c *ClobClient) GetVersion() int {
	resp, err := c.httpClient.Get(polymarket.Version, nil)
	if err != nil {
		return polymarket.OrderVersionV2
	}
	m, ok := resp.(map[string]interface{})
	if !ok {
		return polymarket.OrderVersionV2
	}
	switch v := m["version"].(type) {
	case float64:
		return int(v)
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return polymarket.OrderVersionV2
}

// ResolveOrderVersion 返回缓存的服务器订单版本,首次调用会请求 /version。
// forceRefresh=true 时强制重新询问。永不返回 error —— 与 Python 一致。
func (c *ClobClient) ResolveOrderVersion(forceRefresh bool) int {
	c.mu.RLock()
	if !forceRefresh && c.cachedVersion != nil {
		v := *c.cachedVersion
		c.mu.RUnlock()
		return v
	}
	c.mu.RUnlock()

	v := c.GetVersion()
	c.mu.Lock()
	c.cachedVersion = &v
	c.mu.Unlock()
	return v
}

// SetCachedOrderVersion 注入缓存的订单版本(测试/离线模式用)。
func (c *ClobClient) SetCachedOrderVersion(v int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cachedVersion = &v
}

// retryOnVersionUpdate 执行 fn;若 fn 内部因订单版本不匹配触发了缓存刷新
// (PostOrderV2 检测到 order_version_mismatch 时会 force update),则用新版本
// 再跑一次 fn。
//
// 关键:本函数 **只读缓存版本**,不主动 force refresh /version。force refresh
// 的唯一入口是 PostOrderV2 内部的 IsOrderVersionMismatch 检测。这样可以
// 保证:服务器没有真的拒绝过订单时,我们绝不会重复 POST。与 py-clob-client-v2
// _retry_on_version_update 行为一致。
func (c *ClobClient) retryOnVersionUpdate(fn func() (interface{}, error)) (interface{}, error) {
	version := c.ResolveOrderVersion(false)
	var lastResult interface{}
	var lastErr error
	for i := 0; i < 2; i++ {
		// 第二次迭代前小睡一会儿。原因:版本不匹配一般意味着 server 刚翻版本,
		// 此时立刻第二次 POST 容易和第一笔(可能正在排队)冲突或者打到
		// 旧后端节点 → 两笔都成功 → 重复下单。100ms 等服务端 propagate 完毕。
		if i > 0 {
			time.Sleep(100 * time.Millisecond)
		}
		lastResult, lastErr = fn()
		// 只读缓存:除非 fn() 内部主动 force-refreshed,本次循环看到的版本就是 fn 用的版本
		if version == c.ResolveOrderVersion(false) {
			return lastResult, lastErr
		}
		version = c.ResolveOrderVersion(false)
	}
	return lastResult, lastErr
}

// IsOrderVersionMismatch 用 py-clob-client-v2 的判定方式检查响应是否表示版本不匹配。
func IsOrderVersionMismatch(resp interface{}) bool {
	switch v := resp.(type) {
	case map[string]interface{}:
		e, ok := v["error"]
		if !ok || e == nil {
			return false
		}
		switch ev := e.(type) {
		case string:
			return strings.Contains(ev, polymarket.OrderVersionMismatchError)
		default:
			b, err := json.Marshal(ev)
			if err != nil {
				return false
			}
			return strings.Contains(string(b), polymarket.OrderVersionMismatchError)
		}
	}
	return false
}

// ============================================================
//  市场信息缓存(V2)
// ============================================================

// GetMarketByToken 通过 token id 反查市场详情,并缓存 token→condition 映射。
// 对应 GET /markets-by-token/{token_id}。
func (c *ClobClient) GetMarketByToken(tokenID string) (map[string]interface{}, error) {
	resp, err := c.httpClient.Get(polymarket.GetMarketByToken+tokenID, nil)
	if err != nil {
		return nil, err
	}
	m, ok := resp.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected /markets-by-token response: %T", resp)
	}
	if cid, ok := m["condition_id"].(string); ok && cid != "" {
		c.mu.Lock()
		c.tokenCondition[tokenID] = cid
		c.mu.Unlock()
	}
	return m, nil
}

// GetClobMarketInfo 拉取并缓存 V2 形式的市场详情。
// 对应 GET /clob-markets/{condition_id}。
//
// 对齐 py-clob-client-v2 client.py:309-313 —— 响应缺 tokens 字段或为空时必须
// 直接报错。否则下游 adjustBuyAmountForBalance 会因 fee_rate 缺失退化为
// "按 0 fee 下单",余额保护失效。
func (c *ClobClient) GetClobMarketInfo(conditionID string) (*polymarket.MarketDetails, error) {
	resp, err := c.httpClient.Get(polymarket.GetClobMarket+conditionID, nil)
	if err != nil {
		return nil, err
	}
	if resp == nil {
		return nil, fmt.Errorf("failed to fetch market info for condition id %s: empty response", conditionID)
	}
	b, err := json.Marshal(resp)
	if err != nil {
		return nil, fmt.Errorf("marshal clob market info: %w", err)
	}
	var md polymarket.MarketDetails
	if err := json.Unmarshal(b, &md); err != nil {
		return nil, fmt.Errorf("unmarshal clob market info: %w", err)
	}
	if len(md.Tokens) == 0 {
		return nil, fmt.Errorf("failed to fetch market info for condition id %s: no tokens in response", conditionID)
	}

	// 缓存 token-level 信息
	c.mu.Lock()
	c.marketDetails[conditionID] = &md
	for _, tk := range md.Tokens {
		if tk.TokenID == "" {
			continue
		}
		c.tokenCondition[tk.TokenID] = conditionID
		if md.MinTickSize != "" {
			c.tickSizes[tk.TokenID] = polymarket.TickSize(md.MinTickSize)
		}
		c.negRisk[tk.TokenID] = md.NegRisk
		if md.FeeDetails != nil {
			c.feeInfos[tk.TokenID] = &polymarket.FeeInfo{Rate: md.FeeDetails.FeeRate, Exponent: float64(md.FeeDetails.Exponent)}
		}
	}
	c.mu.Unlock()
	return &md, nil
}

// ensureMarketInfoCached 确保给定 tokenID 的 fee/tick 信息已缓存。
func (c *ClobClient) ensureMarketInfoCached(tokenID string) error {
	c.mu.RLock()
	if _, ok := c.feeInfos[tokenID]; ok {
		c.mu.RUnlock()
		return nil
	}
	cid, hasCond := c.tokenCondition[tokenID]
	c.mu.RUnlock()

	if !hasCond {
		m, err := c.GetMarketByToken(tokenID)
		if err != nil {
			return err
		}
		var ok bool
		cid, ok = m["condition_id"].(string)
		if !ok || cid == "" {
			return fmt.Errorf("failed to resolve condition id for token %s", tokenID)
		}
	}
	_, err := c.GetClobMarketInfo(cid)
	return err
}

// GetFeeExponent 返回市场费率指数。
func (c *ClobClient) GetFeeExponent(tokenID string) (float64, error) {
	c.mu.RLock()
	if fi, ok := c.feeInfos[tokenID]; ok {
		c.mu.RUnlock()
		return fi.Exponent, nil
	}
	c.mu.RUnlock()
	if err := c.ensureMarketInfoCached(tokenID); err != nil {
		return 0, err
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	if fi, ok := c.feeInfos[tokenID]; ok {
		return fi.Exponent, nil
	}
	return 0, nil
}

// ============================================================
//  Builder API key / fee rate
// ============================================================

// CreateBuilderAPIKeyCreds 创建 builder API key,返回服务端 raw 响应(map / list)。
// 对应 POST /auth/builder-api-key,需要 L2 认证。
//
// 对齐 py-clob-client-v2.create_builder_api_key:**无 body**。服务端通过
// L2 凭证(api_key)关联 builder code,而不是从 body 读 —— V2 builder code
// 已经放进每笔订单的 builder 字段做归因,这里只是注册一对 builder key。
//
// 历史变更:本方法返回类型从 `*BuilderApiKeyResponse` 改为 `interface{}`。
// 原因是早期 typed struct 的字段名(api_key/api_secret/api_passphrase/builder_code)
// 与 V2 服务端实际字段名(key/secret/passphrase)完全不对,真用了也只会拿到
// 空字段。新设计与 Python V2 一致返回 raw response,并提供 ParseBuilderApiKey
// 做容错解析。要 typed 视图请用便捷方法 CreateBuilderAPIKey(无 Creds 后缀)。
func (c *ClobClient) CreateBuilderAPIKeyCreds() (interface{}, error) {
	if err := c.assertLevel2Auth(); err != nil {
		return nil, err
	}
	req := &polymarket.RequestArgs{Method: "POST", RequestPath: polymarket.CreateBuilderAPIKey}
	headers, err := polymarket.CreateLevel2Headers(c.signer, c.creds, req)
	if err != nil {
		return nil, err
	}
	return c.httpClient.Post(polymarket.CreateBuilderAPIKey, headers, nil)
}

func (c *ClobClient) CreateBuilderAPIKeyCredsWithAddress() (interface{}, error) {
	//if err := c.assertLevel2Auth(); err != nil {
	//	return nil, err
	//}
	req := &polymarket.RequestArgs{Method: "POST", RequestPath: polymarket.CreateBuilderAPIKey}
	headers, err := CreateLevel2HeadersWithAddress(c.address, c.creds, req)
	if err != nil {
		return nil, err
	}
	return c.httpClient.Post(polymarket.CreateBuilderAPIKey, headers, nil)
}

func CreateLevel2HeadersWithAddress(address string, creds *polymarket.ApiCreds, requestArgs *polymarket.RequestArgs) (map[string]string, error) {
	timestamp := int(time.Now().Unix())

	// 优先使用预序列化的body
	var bodyForSig interface{}
	if requestArgs.SerializedBody != nil {
		bodyForSig = *requestArgs.SerializedBody
	} else {
		bodyForSig = requestArgs.Body
	}

	secretBytes, err := creds.DecodedSecret()
	if err != nil {
		return nil, fmt.Errorf("failed to decode secret: %w", err)
	}

	hmacSig, err := polymarket.BuildHMACSignatureRaw(
		secretBytes,
		timestamp,
		requestArgs.Method,
		requestArgs.RequestPath,
		bodyForSig,
	)
	if err != nil {
		return nil, err
	}

	return map[string]string{
		polymarket.PolyAddress:    address,
		polymarket.PolySignature:  hmacSig,
		polymarket.PolyTimestamp:  strconv.Itoa(timestamp),
		polymarket.PolyAPIKey:     creds.APIKey,
		polymarket.PolyPassphrase: creds.APIPassphrase,
	}, nil
}

// CreateBuilderAPIKey 是 CreateBuilderAPIKeyCreds 的 typed 便捷封装:
// 调用 raw API → 用 ParseBuilderApiKey 解析为 *BuilderApiKey(key/secret/passphrase)。
// 解析失败会向上抛错。需要 raw 响应或非标准字段时直接用 CreateBuilderAPIKeyCreds。
func (c *ClobClient) CreateBuilderAPIKey() (*polymarket.BuilderApiKey, error) {
	raw, err := c.CreateBuilderAPIKeyCreds()
	if err != nil {
		return nil, err
	}
	return polymarket.ParseBuilderApiKey(raw)
}

func (c *ClobClient) CreateBuilderAPIKeyWithAddress() (*polymarket.BuilderApiKey, error) {
	raw, err := c.CreateBuilderAPIKeyCredsWithAddress()
	if err != nil {
		return nil, err
	}
	return polymarket.ParseBuilderApiKey(raw)
}

// GetBuilderAPIKeysList 列出 builder API key。需要 L2 认证。
func (c *ClobClient) GetBuilderAPIKeysList() (interface{}, error) {
	if err := c.assertLevel2Auth(); err != nil {
		return nil, err
	}
	req := &polymarket.RequestArgs{Method: "GET", RequestPath: polymarket.GetBuilderAPIKeysEndpoint}
	headers, err := polymarket.CreateLevel2Headers(c.signer, c.creds, req)
	if err != nil {
		return nil, err
	}
	return c.httpClient.Get(polymarket.GetBuilderAPIKeysEndpoint, headers)
}

// RevokeBuilderAPIKeyCreds 撤销 builder API key。需要 L2 认证。
func (c *ClobClient) RevokeBuilderAPIKeyCreds() (interface{}, error) {
	if err := c.assertLevel2Auth(); err != nil {
		return nil, err
	}
	req := &polymarket.RequestArgs{Method: "DELETE", RequestPath: polymarket.RevokeBuilderAPIKey}
	headers, err := polymarket.CreateLevel2Headers(c.signer, c.creds, req)
	if err != nil {
		return nil, err
	}
	return c.httpClient.Delete(polymarket.RevokeBuilderAPIKey, headers, nil)
}

// GetBuilderFeeRate 拉取并缓存 builder code 的费率。
// 对应 GET /fees/builder-fees/{code}。
func (c *ClobClient) GetBuilderFeeRate(builderCode string) (*polymarket.BuilderFeeRate, error) {
	if builderCode == "" || builderCode == polymarket.Bytes32Zero {
		return &polymarket.BuilderFeeRate{}, nil
	}
	c.mu.RLock()
	if r, ok := c.builderFeeRates[builderCode]; ok {
		c.mu.RUnlock()
		return r, nil
	}
	c.mu.RUnlock()

	resp, err := c.httpClient.Get(polymarket.GetBuilderFeeRate+builderCode, nil)
	if err != nil {
		return nil, err
	}
	b, _ := json.Marshal(resp)
	var raw polymarket.BuilderFeeRateRaw
	if err := json.Unmarshal(b, &raw); err != nil {
		return nil, fmt.Errorf("decode builder fee rate: %w", err)
	}
	rate := &polymarket.BuilderFeeRate{
		Maker: float64(raw.BuilderMakerFeeRateBps) / float64(polymarket.BuilderFeesBps),
		Taker: float64(raw.BuilderTakerFeeRateBps) / float64(polymarket.BuilderFeesBps),
	}
	c.mu.Lock()
	c.builderFeeRates[builderCode] = rate
	c.mu.Unlock()
	return rate, nil
}

// ============================================================
//  其他 V2 端点
// ============================================================

// GetOKv2 调用 V2 /ok 健康检查。
func (c *ClobClient) GetOKv2() (interface{}, error) {
	return c.httpClient.Get(polymarket.OK, nil)
}

// GetPreMigrationOrders 列出迁移前订单。需要 L2。
func (c *ClobClient) GetPreMigrationOrders(params *polymarket.OpenOrderParams, nextCursor string) ([]interface{}, error) {
	if err := c.assertLevel2Auth(); err != nil {
		return nil, err
	}
	if nextCursor == "" {
		nextCursor = "MA=="
	}
	req := &polymarket.RequestArgs{Method: "GET", RequestPath: polymarket.PreMigrationOrders}
	headers, err := polymarket.CreateLevel2Headers(c.signer, c.creds, req)
	if err != nil {
		return nil, err
	}
	var results []interface{}
	for nextCursor != polymarket.EndCursor {
		u := polymarket.AddQueryOpenOrdersParams(c.host+polymarket.PreMigrationOrders, params, nextCursor)
		resp, err := c.httpClient.Get(u[len(c.host):], headers)
		if err != nil {
			return nil, err
		}
		respMap, ok := resp.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("invalid pre-migration orders response: %T", resp)
		}
		if cursor, ok := respMap["next_cursor"].(string); ok {
			nextCursor = cursor
		} else {
			nextCursor = polymarket.EndCursor
		}
		if data, ok := respMap["data"].([]interface{}); ok {
			results = append(results, data...)
		}
	}
	return results, nil
}

// GetPricesHistory 拉取价格历史。无需认证。
func (c *ClobClient) GetPricesHistory(params *polymarket.PricesHistoryParams) (interface{}, error) {
	if params == nil || params.Market == "" {
		return nil, fmt.Errorf("market is required")
	}
	q := url.Values{}
	q.Set("market", params.Market)
	if params.StartTs > 0 {
		q.Set("startTs", strconv.FormatInt(params.StartTs, 10))
	}
	if params.EndTs > 0 {
		q.Set("endTs", strconv.FormatInt(params.EndTs, 10))
	}
	if params.Interval != "" {
		q.Set("interval", string(params.Interval))
	}
	if params.Fidelity > 0 {
		q.Set("fidelity", strconv.Itoa(params.Fidelity))
	}
	return c.httpClient.Get(polymarket.GetPricesHistory+"?"+q.Encode(), nil)
}

// ============================================================
//  V2 订单创建 / 签名
// ============================================================

// CreateOrderV2 构造并签名 V2 限价订单(对应 py-clob-client-v2.create_order)。
// 需要 L1 认证。返回的 *SignedOrderV2 可以传给 PostOrderV2 / CreateAndPostOrderV2。
//func (c *ClobClient) CreateOrderV2(args *polymarket.OrderArgsV2, options *polymarket.PartialCreateOrderOptions) (*obuilder.SignedOrderV2, error) {
//	if err := c.assertLevel1Auth(); err != nil {
//		return nil, err
//	}
//	if args == nil {
//		return nil, fmt.Errorf("args is nil")
//	}
//
//	// 本函数不污染调用方 args:所有派生值都放 local 变量。
//	// 通过 defaultBuilderCode() 安全读全局 builder code(加 RLock),避免与
//	// SetBuilderConfig 的并发写产生 data race。
//	builderCode := args.BuilderCode
//	if def := c.defaultBuilderCode(); def != "" {
//		if builderCode == "" || builderCode == polymarket.Bytes32Zero {
//			builderCode = def
//		}
//	}
//
//	tokenID := args.TokenID
//	tickSize, negRisk, err := c.resolveTickAndNegRisk(tokenID, options)
//	if err != nil {
//		return nil, err
//	}
//	if !polymarket.PriceValid(args.Price, tickSize) {
//		tsf, _ := strconv.ParseFloat(string(tickSize), 64)
//		return nil, fmt.Errorf("invalid price (%v), min: %s - max: %v", args.Price, tickSize, 1-tsf)
//	}
//	roundConfig, ok := obuilder.RoundingConfig[string(tickSize)]
//	if !ok {
//		return nil, fmt.Errorf("unsupported tick size: %s", tickSize)
//	}
//
//	// 对齐 py-clob-client-v2 client.py:730-748:
//	// 必须先把 price round_normal 到 tick 精度,**后续 fee 计算与 build 都用同一个 price**。
//	// 否则:用户传入 0.555、tick=0.01 时,fee 按 0.555 估算余额,而签出去的订单
//	// 是 price=0.56,余额保护会低估实际需要的 USDC。
//	price := obuilder.RoundNormal(args.Price, roundConfig.Price)
//
//	// V2 BUY 单且调用方提供 user_usdc_balance 时,SDK 自动按市场费率公式
//	// 缩小 size 以让 maker_amount + 平台费 + builder taker 费 <= 余额。
//	size := args.Size
//	if (args.Side == polymarket.BUY || args.Side == "BUY") && args.UserUsdcBalance != nil {
//		adjustedAmount, err := c.adjustBuyAmountForBalance(tokenID, size*price, price, *args.UserUsdcBalance, builderCode)
//		if err != nil {
//			return nil, err
//		}
//		if price > 0 {
//			size = adjustedAmount / price
//		}
//	}
//
//	// 把 round 后的 price 传给 builder。GetOrderAmountsV2 内部对 price 再做
//	// RoundNormal 是幂等的(round_normal(round_normal(x)) == round_normal(x))。
//	side, makerAmt, takerAmt, err := obuilder.GetOrderAmountsV2(args.Side, size, price, roundConfig)
//	if err != nil {
//		return nil, err
//	}
//
//	// V2 builder 选合约
//	cfg, err := polymarket.GetContractConfig(c.chainID)
//	if err != nil {
//		return nil, err
//	}
//	exchangeAddr := cfg.GetExchangeForVersion(polymarket.OrderVersionV2, negRisk)
//	v2Builder, err := c.getOrCreateV2Builder(exchangeAddr)
//	if err != nil {
//		return nil, err
//	}
//
//	// signer 选择(与 py-clob-client-v2._v2_order_signer 一致):
//	//   - EOA / PolyProxy / Safe 路径:signer = 签名者 EOA(用 ECDSA 私钥签 EIP-712)
//	//     此时 order.maker 是 wallet(proxy / safe / deposit),order.signer 是 EOA
//	//     —— 经 Polymarket 网页 POST /order 真实抓包验证此组合
//	//   - POLY_1271 路径:signer = funder(Deposit Wallet 合约地址);链上验签
//	//     走 EIP-1271 isValidSignature,合约内部把签名 delegate 回 owner EOA
//	signerAddr := v2Builder.SignerAddress().Hex()
//	if c.sigType == polymarket.SigTypePoly1271 {
//		signerAddr = c.funder
//	}
//
//	data := &obuilder.OrderDataV2{
//		Maker:         c.funder,
//		Signer:        signerAddr,
//		TokenID:       tokenID,
//		MakerAmount:   makerAmt.String(),
//		TakerAmount:   takerAmt.String(),
//		Side:          int(side),
//		SignatureType: c.sigType,
//		Metadata:      defaultBytes32(args.Metadata),
//		Builder:       defaultBytes32(builderCode),
//		Expiration:    strconv.FormatInt(args.Expiration, 10),
//	}
//	return v2Builder.BuildSignedOrder(data)
//}

//// CreateMarketOrderV2 构造并签名 V2 市价订单。需要 L1 认证。
//func (c *ClobClient) CreateMarketOrderV2(args *polymarket.MarketOrderArgsV2, options *polymarket.PartialCreateOrderOptions) (*obuilder.SignedOrderV2, error) {
//	if err := c.assertLevel1Auth(); err != nil {
//		return nil, err
//	}
//	if args == nil {
//		return nil, fmt.Errorf("args is nil")
//	}
//
//	// 本函数不应该污染调用方传入的 args(对齐 py-clob-client-v2 使用
//	// dataclass_replace 的语义)。所有派生值都用 local 变量。
//	// 通过 defaultBuilderCode() helper 安全并发读全局 builder code。
//	builderCode := args.BuilderCode
//	if def := c.defaultBuilderCode(); def != "" {
//		if builderCode == "" || builderCode == polymarket.Bytes32Zero {
//			builderCode = def
//		}
//	}
//
//	tokenID := args.TokenID
//	tickSize, negRisk, err := c.resolveTickAndNegRisk(tokenID, options)
//	if err != nil {
//		return nil, err
//	}
//
//	// price 优先用调用方传入,否则按 orderbook 算市价 —— 都写到 local 变量,
//	// 不回写 args.Price。
//	price := args.Price
//	if price <= 0 {
//		ot := args.OrderType
//		if ot == "" {
//			ot = polymarket.OrderTypeFOK
//		}
//		p, err := c.CalculateMarketPrice(tokenID, args.Side, args.Amount, ot)
//		if err != nil {
//			return nil, err
//		}
//		price = p
//	}
//	if !PriceValid(price, tickSize) {
//		tsf, _ := strconv.ParseFloat(string(tickSize), 64)
//		return nil, fmt.Errorf("invalid price (%v), min: %s - max: %v", price, tickSize, 1-tsf)
//	}
//	roundConfig, ok := obuilder.RoundingConfig[string(tickSize)]
//	if !ok {
//		return nil, fmt.Errorf("unsupported tick size: %s", tickSize)
//	}
//
//	// 关键:V2 市价单的 price 内部一律 RoundDown(见 GetMarketOrderAmountsV2)。
//	// fee 估算 / 余额调整必须用 *同一个* rounded price,否则:
//	//   - 估算用 0.555,实际签单按 0.55 → 实际 taker 数量 = amount/0.55(更多 share)
//	//   - 实际 platformFee > 估算 → 用户余额刚够时,签出超过保护意图的订单
//	// 一句话:先 round,后处处都用 rounded 值。
//	roundedPrice := obuilder.RoundDown(price, roundConfig.Price)
//
//	// V2 BUY 市价单且调用方提供 user_usdc_balance 时,SDK 自动调整 amount。
//	amount := args.Amount
//	if (args.Side == BUY || args.Side == "BUY") && args.UserUsdcBalance > 0 {
//		adjusted, err := c.adjustBuyAmountForBalance(tokenID, amount, roundedPrice, args.UserUsdcBalance, builderCode)
//		if err != nil {
//			return nil, err
//		}
//		amount = adjusted
//	}
//
//	side, makerAmt, takerAmt, err := obuilder.GetMarketOrderAmountsV2(args.Side, amount, roundedPrice, roundConfig)
//	if err != nil {
//		return nil, err
//	}
//
//	cfg, err := GetContractConfig(c.chainID)
//	if err != nil {
//		return nil, err
//	}
//	exchangeAddr := cfg.GetExchangeForVersion(OrderVersionV2, negRisk)
//	v2Builder, err := c.getOrCreateV2Builder(exchangeAddr)
//	if err != nil {
//		return nil, err
//	}
//
//	// signer 选择:只有 POLY_1271 时 signer = funder,其他都 signer = EOA。
//	// 详见 CreateOrderV2 注释。
//	signerAddr := v2Builder.SignerAddress().Hex()
//	if c.sigType == SigTypePoly1271 {
//		signerAddr = c.funder
//	}
//
//	data := &obuilder.OrderDataV2{
//		Maker:         c.funder,
//		Signer:        signerAddr,
//		TokenID:       tokenID,
//		MakerAmount:   makerAmt.String(),
//		TakerAmount:   takerAmt.String(),
//		Side:          int(side),
//		SignatureType: c.sigType,
//		Metadata:      defaultBytes32(args.Metadata),
//		Builder:       defaultBytes32(builderCode),
//		Expiration:    "0",
//	}
//	return v2Builder.BuildSignedOrder(data)
//}

// PostOrderV2 提交一个已签名的 V2 订单。
// 与 V1 PostOrder 的区别:这里用 V2 的 JSON payload(包含 timestamp/metadata/builder
// 而不是 taker/nonce/feeRateBps)。需要 L2 认证。
// PostOrderV2 提交 V2 订单。需要 L2 认证。
//
// 想用 context.Context 控 HTTP 取消,见 PostOrderV2Ctx。
//func (c *ClobClient) PostOrderV2(order *obuilder.SignedOrderV2, orderType OrderType, postOnly, deferExec bool) (*PostOrderResultV2, error) {
//	return c.PostOrderV2Ctx(context.Background(), order, orderType, postOnly, deferExec)
//}

// CreateAndPostOrderV2 = CreateOrderV2 + PostOrderV2,失败时根据 /version
// 重试一次(对应 py-clob-client-v2._retry_on_version_update)。
//
// 想用 context.Context 控 POST 阶段的 HTTP 取消,见 CreateAndPostOrderV2Ctx。
//func (c *ClobClient) CreateAndPostOrderV2(
//	args *polymarket.OrderArgsV2,
//	options *polymarket.PartialCreateOrderOptions,
//	orderType polymarket.OrderType,
//	postOnly, deferExec bool,
//) (*polymarket.PostOrderResultV2, error) {
//	return c.CreateAndPostOrderV2Ctx(context.Background(), args, options, orderType, postOnly, deferExec)
//}

// CreateAndPostMarketOrderV2 = CreateMarketOrderV2 + PostOrderV2 + retry。
//
// 想用 context.Context 控 POST 阶段的 HTTP 取消,见 CreateAndPostMarketOrderV2Ctx。
//func (c *ClobClient) CreateAndPostMarketOrderV2(
//	args *MarketOrderArgsV2,
//	options *PartialCreateOrderOptions,
//	orderType OrderType,
//	deferExec bool,
//) (*PostOrderResultV2, error) {
//	return c.CreateAndPostMarketOrderV2Ctx(context.Background(), args, options, orderType, deferExec)
//}

// PostOrdersV2 批量提交 V2 订单。需要 L2。
//
// 对 args 里任一元素的 Order 为 nil 会直接 error,带上 index 方便调用方定位。
func (c *ClobClient) PostOrdersV2(args []polymarket.PostOrdersArgsV2) (*polymarket.PostOrdersResultV2, error) {
	if err := c.assertLevel2Auth(); err != nil {
		return nil, err
	}
	body := make([]map[string]interface{}, len(args))
	for i, a := range args {
		if a.Order == nil {
			return nil, fmt.Errorf("PostOrdersV2 args[%d].Order is nil", i)
		}
		if a.PostOnly && (a.OrderType == polymarket.OrderTypeFOK || a.OrderType == polymarket.OrderTypeFAK) {
			return nil, fmt.Errorf("PostOrdersV2 args[%d]: post_only orders cannot be FOK or FAK", i)
		}
		ot := a.OrderType
		if ot == "" {
			ot = polymarket.OrderTypeGTC
		}
		body[i] = a.Order.ToJSONPayload(c.creds.APIKey, string(ot), a.PostOnly, a.DeferExec)
	}
	bodyStr, err := polymarket.MarshalCompact(body)
	if err != nil {
		return nil, err
	}
	req := &polymarket.RequestArgs{
		Method:         "POST",
		RequestPath:    polymarket.PostOrders,
		Body:           body,
		SerializedBody: &bodyStr,
	}
	headers, err := polymarket.CreateLevel2Headers(c.signer, c.creds, req)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Post(polymarket.PostOrders, headers, bodyStr)
	if err != nil {
		return nil, err
	}
	if IsOrderVersionMismatch(resp) {
		c.ResolveOrderVersion(true)
	}
	return &polymarket.PostOrdersResultV2{Payload: body, Response: resp}, nil
}

// ============================================================
//  内部 helpers
// ============================================================

// resolveTickAndNegRisk 解析 tick + negRisk,优先用本地 cache。
// RawOrder 模式直接走调用方传入。
//
// 性能优化:cache miss 时不再分别打 /tick-size + /neg-risk(2 次串行 HTTP),
// 而是调一次 /clob-markets/{condition} 把 tick、neg_risk、fee_info 全填到
// 缓存里 —— 这样后续 BUY+balance 路径的 adjustBuyAmountForBalance 不会再
// 触发 ensureMarketInfoCached → 又一次 HTTP。首次冷启动 4 次 HTTP → 1 次。

// getOrCreateV2Builder 按 contract address 缓存 V2 builder。
//
// 并发安全:双重检查锁。两个 goroutine 同时第一次访问 → 都过 RLock check
// → 都进 NewExchangeOrderBuilderV2(里面做 EIP-712 domain hash,有点贵)。
// 二次进 Lock 后必须重新检查,避免重复创建 + 覆盖。
func (c *ClobClient) getOrCreateV2Builder(contractAddress string) (*obuilder.ExchangeOrderBuilderV2, error) {
	key := strings.ToLower(contractAddress)
	c.mu.RLock()
	if b, ok := c.builderV2Cache[key]; ok {
		c.mu.RUnlock()
		return b, nil
	}
	c.mu.RUnlock()

	if c.signer == nil {
		return nil, fmt.Errorf("signer required for V2 order creation")
	}
	pk, err := loadPrivateKey(c.signer)
	if err != nil {
		return nil, err
	}
	b, err := obuilder.NewExchangeOrderBuilderV2(contractAddress, c.chainID, pk, nil)
	if err != nil {
		return nil, err
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	// 双重检查:别的 goroutine 可能在我们 NewExchangeOrderBuilderV2 期间已经写入
	if existing, ok := c.builderV2Cache[key]; ok {
		return existing, nil
	}
	c.builderV2Cache[key] = b
	return b, nil
}

// loadPrivateKey 从 Signer 中提取 *ecdsa.PrivateKey。
func loadPrivateKey(s *polymarket.Signer) (*ecdsa.PrivateKey, error) {
	hexStr := s.GetPrivateKey()
	if strings.HasPrefix(hexStr, "0x") || strings.HasPrefix(hexStr, "0X") {
		hexStr = hexStr[2:]
	}
	return crypto.HexToECDSA(hexStr)
}

func defaultBytes32(v string) string {
	if v == "" {
		return polymarket.Bytes32Zero
	}
	return v
}

// 兼容辅助:从 common.Hex 处理任意大小数字到 *big.Int(测试用)。
var _ = func(_ *big.Int) {}
var _ = func(_ common.Address) {}
