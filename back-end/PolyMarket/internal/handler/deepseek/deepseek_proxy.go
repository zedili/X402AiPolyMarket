package deepseek

import (
	"X402AiPolyMarket/PolyMarket/internal/config"
	"X402AiPolyMarket/PolyMarket/internal/logic/aiPrediction"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/x402"
	_ "X402AiPolyMarket/PolyMarket/internal/x402"
	"bufio"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/cache"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest/httpx"
)

type DeepSeekProxyHandler struct {
	apiKey       string
	cache        cache.ChatCache
	singleFlight *cache.SingleFlight
	httpClient   *http.Client
	x402Config   config.X402Config
	logger       logx.Logger
}

// ServeHTTP 实现 http.Handler 接口，这样就能直接用于 go-zero 的路由注册
func (h *DeepSeekProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.Handle(w, r)
}

// NewDeepSeekProxyHandler 使用 ServiceContext 创建处理器
func NewDeepSeekProxyHandler(svcCtx *svc.ServiceContext) *DeepSeekProxyHandler {
	apiKey := svcCtx.Config.DeepseekConfig.ApiKey // 需在 config 中添加

	// 使用 Redis 实现缓存
	redisClient := model.RDB                                        // 假设 model 包提供获取 Redis 客户端的方法
	chatCache := cache.NewRedisCache(redisClient, "deepseek:cache") // Redis key 前缀

	x402Config := config.X402Config{
		Enable: svcCtx.Config.X402Config.Enable,
	}

	return &DeepSeekProxyHandler{
		apiKey:       apiKey,
		cache:        chatCache,
		singleFlight: cache.NewSingleFlight(),
		x402Config:   x402Config,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
			Transport: &http.Transport{ // ✅ 添加 Transport 配置
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

func (h *DeepSeekProxyHandler) Handle(w http.ResponseWriter, r *http.Request) {

	logger := logx.WithContext(r.Context())

	// 从上下文获取用户地址
	userAddress, ok := middleware.GetWalletAddress(r.Context())
	if !ok || userAddress == "" {
		utils.Unauthorized(w, "User not authenticated")
		return
	}

	// 1. 读取请求体
	bodyBytes, err := io.ReadAll(r.Body)

	if err != nil {
		httpx.Error(w, err)
		return
	}
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// 2. 生成缓存键
	cacheKey, err := utils.GenerateCacheKey(bodyBytes)
	if err != nil {
		// 缓存 key 生成失败，降级直接转发
		logger.Errorf("生成缓存键失败: %v", err)
		// 生产预测 key 失败，可能是预测信息格式错误
		utils.ServerError(w, "System busy")
		return
	}

	// 📌 检查支付状态
	if middleware.GetX402Status(w) == middleware.CheckCacheKeyPayStatus {
		// 未开启 x402
		if !h.x402Config.Enable {
			utils.ServerError(w, "System busy")
			return
		}

		// 判断这个用户是否支付这预测key： cachekey
		paid, _, checkErr := aiPrediction.
			NewPredictionPaymentLogic(r.Context()).
			ChenckUserPaidPrediction(userAddress, cacheKey)

		if !paid || checkErr != nil {
			// 📌 如果还没有支付，返回到 x402 中间件，继续执行 x402 支付逻辑
			return
		}
		// 📌 cachekey 已经支付,标记一下，然后放行
		middleware.SetX402Status(w, middleware.CacheKeyPaid) // 设置当前状态为 paid
		w.Header().Set("PAYMENT-STATUS", "PAID")
		logger.Infof("用户已支付预测 key: %s", cacheKey)
	}

	// 📌 facilitator 验证通过，保存支付中的状态，从请求头拿到签名
	var paymentSignature x402.PaymentSignature
	if middleware.GetX402Status(w) == middleware.X402Verified {

		paymentSignatureBase64 := r.Header.Get("Payment-Signature")
		if paymentJson, err := base64.StdEncoding.DecodeString(paymentSignatureBase64); err == nil {

			if err := json.Unmarshal(paymentJson, &paymentSignature); err != nil {
				logger.Errorf("解析 PaymentSignature 失败: %v", err)
				utils.ServerError(w, "System busy")
				return
			}
		}
		//	paymentSignature 是链上交易签名
		_, creErr := aiPrediction.
			NewPredictionPaymentLogic(r.Context()).
			UpdatePaymentInfo(userAddress,
				paymentSignature.Payload.Authorization.Value,
				paymentSignature.Accepted.Extra.Name,
				cacheKey)

		if creErr != nil {
			utils.ServerError(w, "System busy")
			return
		}
		logger.Infof("x402 验证成功 key: %s：%s", cacheKey)
		// 返回到x402 中间件， 继续执行 x402 逻辑
		return
	}

	// 📌 facilitator 结算成功
	if middleware.GetX402Status(w) == middleware.X402SettleSuccess {
		txHash := middleware.GetX402TxHash(w)
		if txHash != "" {
			//	paymentSignature 是链上交易签名
			err = aiPrediction.
				NewPredictionPaymentLogic(r.Context()).
				UpdatePaymentTxHash(cacheKey, userAddress, txHash)
			logger.Infof("x402 结算成功 key: %s, txHash: %s", cacheKey, txHash)
		}
	}

	// 先检查缓存,命中及时返回缓存数据
	if cv, ok := h.cache.Get(cacheKey); ok && cv != nil {
		logger.Infof("DeepSeek cache hit: %s", cacheKey)
		w.Header().Set("X-Cache", "HIT") // 命中缓存
		h.serveCachedStream(w, r, cv)
		return
	}
	logger.Infof("DeepSeek cache miss: %s", cacheKey)
	//

	// 📌📌📌 用户支付了预测
	// 📌 单飞模式：先查询缓存，没有命中缓存，单飞模式调用 deepseek 进行预测并缓存
	cacheValue, err := h.singleFlight.Do(cacheKey, func() (*cache.CacheValue, error) {
		// 双重检查（防止并发时重复构建）
		if cv, ok := h.cache.Get(cacheKey); ok && cv != nil {
			cv.FromCache = true
			return cv, nil
		}
		cv, err := h.fetchAndCacheStream(cacheKey, bodyBytes, r)
		if err == nil && cv != nil {
			cv.FromCache = false
		}
		return cv, err
	})

	if err != nil {
		logger.Errorf("获取DeepSeek响应失败: %v", err)
		httpx.Error(w, err)
		return
	}

	if cacheValue == nil {
		logger.Errorf("获取预测响应失败")
		httpx.Error(w, errors.New("获取预测响应失败"))
		return
	}

	// 返回响应
	if cacheValue.FromCache {
		logger.Infof("single flyght DeepSeek cache hit: %s", cacheKey)
		w.Header().Set("X-Cache", "HIS") // 请求头标记：没有命中缓存
	} else {
		logger.Infof("single flyght DeepSeek cache miss: %s", cacheKey)
		w.Header().Set("X-Cache", "MISS") // 请求头标记：没有命中缓存
	}

	if cacheValue.Type == cache.CacheValueJSON {
		w.Header().Set("Content-Type", "application/json")
		w.Write(cacheValue.JsonBody)
	} else {
		h.serveCachedStream(w, r, cacheValue)
	}
}

// 非流式请求：转发并缓存完整JSON
func (h *DeepSeekProxyHandler) fetchAndCacheNonStream(cacheKey string, body []byte) (*cache.CacheValue, error) {
	req, err := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+h.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("deepseek returned status %d", resp.StatusCode)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// 计算 TTL
	ttl := h.getTTLFromBody(body)

	cv := &cache.CacheValue{
		Type:     cache.CacheValueJSON,
		JsonBody: respBody,
	}
	h.cache.Set(cacheKey, cv, ttl)
	return cv, nil
}

// 流式请求：转发并逐块缓存 SSE 事件
func (h *DeepSeekProxyHandler) fetchAndCacheStream(cacheKey string, body []byte, r *http.Request) (*cache.CacheValue, error) {
	logger := logx.WithContext(r.Context())

	logger.Infof("DeepSeek streaming: %s", cacheKey)
	req, err := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		logger.Errorf("创建 DeepSeek 请求失败: %v", err)
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+h.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(" v %d", resp.StatusCode)
	}

	var events []cache.StreamEvent
	var delays []time.Duration
	var lastTime time.Time

	scanner := bufio.NewScanner(resp.Body)
	// 增大缓冲区防止单行过长
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			continue
		}
		//logger.Infof("获取DeepSeek响应失败: %v", err)
		logger.Debugf("DeepSeek streaming: %s", line)

		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			now := time.Now()
			if lastTime.IsZero() {
				delays = append(delays, 0) // 第一个事件没有延迟
			} else {
				delays = append(delays, now.Sub(lastTime))
			}
			lastTime = now
			events = append(events, cache.StreamEvent{Data: data})
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("读取SSE流失败: %w", err)
	}

	ttl := h.getTTLFromBody(body)

	cv := &cache.CacheValue{
		Type:   cache.CacheValueStream,
		Events: events,
		Delays: delays,
	}
	h.cache.Set(cacheKey, cv, ttl)
	return cv, nil
}

// 从缓存重放流式响应
func (h *DeepSeekProxyHandler) serveCachedStream(w http.ResponseWriter, r *http.Request, cv *cache.CacheValue) {
	logger := logx.WithContext(r.Context())

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no") // 🔑 禁用 Nginx 缓冲

	flusher, ok := w.(*middleware.ResponseCapture).Flusher()
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// 🔑 先发送一个注释行，触发浏览器开始接收
	fmt.Fprint(w, ": connected\n\n")
	flusher.Flush()

	for i, ev := range cv.Events {
		sendTime := time.Now()

		select {
		case <-r.Context().Done(): // 客户端断开或者超时，立即退出
			return
		default:
		}

		if i > 0 && i < len(cv.Delays) {
			logger.Debugf("等待 %.2f ms 后发送第 %d 个事件",
				float64(cv.Delays[i])/1e6, i+1)
			timer := time.NewTimer(cv.Delays[i]) // 按照原延迟等待
			select {
			case <-timer.C:
			case <-r.Context().Done(): // 客户端断开或者超时，停止定时器
				timer.Stop()
				return
			}
		}
		fmt.Fprintf(w, "data: %s\n\n", ev.Data)
		flusher.Flush() // 🔑 每次发送后立即刷新

		actualDelay := time.Since(sendTime)
		logger.Debugf("✅ 已发送第 %d 个事件，实际延迟: %.2f ms",
			i+1, float64(actualDelay)/1e6)

	}
}

// 根据请求的 temperature 确定缓存 TTL
func (h *DeepSeekProxyHandler) getTTLFromBody(body []byte) time.Duration {
	var temp struct {
		Temperature *float64 `json:"temperature"`
	}
	json.Unmarshal(body, &temp)
	t := 1.0
	if temp.Temperature != nil {
		t = *temp.Temperature
	}
	if t == 0 {
		return 24 * time.Hour
	}
	return 1 * time.Hour
}

// 降级：直接转发（不缓存）
func (h *DeepSeekProxyHandler) forwardDirectly(w http.ResponseWriter, r *http.Request, body []byte) {
	proxyReq, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewReader(body))
	proxyReq.Header = r.Header.Clone()
	proxyReq.Header.Del("Content-Length")
	proxyReq.Header.Del("Accept-Encoding")
	proxyReq.Header.Set("Authorization", "Bearer "+h.apiKey)

	resp, err := h.httpClient.Do(proxyReq)
	if err != nil {
		httpx.Error(w, err)
		return
	}
	defer resp.Body.Close()

	// 复制响应头
	for k, v := range resp.Header {
		w.Header()[k] = v
	}
	w.WriteHeader(resp.StatusCode)

	// 处理流式响应
	if strings.Contains(resp.Header.Get("Content-Type"), "text/event-stream") {
		rc := http.NewResponseController(w)
		buf := make([]byte, 32*1024)
		for {
			n, readErr := resp.Body.Read(buf)
			if n > 0 {
				if _, writeErr := w.Write(buf[:n]); writeErr != nil {
					logx.Errorf("写入响应块失败: %v", writeErr)
					break
				}
				// 强制刷新，确保数据实时发送
				if flushErr := rc.Flush(); flushErr != nil {
					if flushErr != http.ErrNotSupported {
						logx.Errorf("刷新响应失败: %v", flushErr)
					}
					break
				}
			}
			if readErr != nil {
				if readErr != io.EOF {
					logx.Errorf("读取代理响应体失败: %v", readErr)
				}
				break
			}
		}
		return
	}

	// 非流式响应，普通拷贝
	io.Copy(w, resp.Body)
}
