package deepseek

import (
	"X402AiPolyMarket/PolyMarket/internal/config"
	"X402AiPolyMarket/PolyMarket/internal/logic/aiPrediction"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/payment"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"bufio"
	"bytes"
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
	"gorm.io/gorm"
)

type DeepSeekProxyHandler struct {
	apiKey       string
	cache        cache.ChatCache
	singleFlight *cache.SingleFlight
	httpClient   *http.Client
	x402Config   config.X402Config
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
		Enable:    svcCtx.Config.X402Config.Enable,
		Amount:    svcCtx.Config.X402Config.Amount,
		Recipient: svcCtx.Config.X402Config.Recipient,
		RpcUrl:    svcCtx.Config.X402Config.RpcUrl,
	}

	return &DeepSeekProxyHandler{
		apiKey:       apiKey,
		cache:        chatCache,
		singleFlight: cache.NewSingleFlight(),
		x402Config:   x402Config,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
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

	// 检查是否携带支付签名（支付成功后的回调）
	paymentSignature := r.Header.Get("X-Payment-Signature")

	if paymentSignature != "" {
		logger.Infof("用户 %s 支付成功，触发 x402 支付流程", userAddress)
		// 获取更多信息
		paymentMemo := r.Header.Get("X-Payment-Memo")
		paymentRecipient := r.Header.Get("X-Payment-Recipient")

		if paymentRecipient != h.x402Config.Recipient {
			logger.Errorf("用户 %s 支付成功，触发 x402 支付流程，但支付信息错误", userAddress)
			utils.ServerError(w, "payment info failed")
			return
		}

		if paymentMemo == "" {
			logger.Errorf("用户 %s 支付成功，触发 x402 支付流程，但缺少必要信息", userAddress)
			// 缺少必要信息
			utils.ServerError(w, "payment info failed")
			return
		}
		//	paymentSignature 是链上交易签名
		err := aiPrediction.
			NewPredictionPaymentLogic(r.Context()).
			UpdatePaymentTxHash(paymentMemo, userAddress, paymentSignature)

		if err != nil {
			utils.ServerError(w, "payment info failed")
			return
		}

		//
		// 拿到链上的验证信息，更新到数据库
		verifyPayment, err := payment.NewPaymentVerifier(h.x402Config.RpcUrl, h.x402Config.Recipient).
			VerifyPayment(r.Context(), paymentSignature)

		if err != nil {
			utils.ServerError(w, "verify payment failed")
			return
		}

		err = aiPrediction.NewPredictionPaymentLogic(r.Context()).
			UpdatePaymentStatus(paymentMemo, userAddress, paymentSignature, &verifyPayment.Payer, &verifyPayment.Recipient)
		if err != nil {
			utils.ServerError(w, "update payment status failed")
			return
		}
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

	// 3. 检查是否流式请求
	var temp struct{ Stream bool }
	_ = json.Unmarshal(bodyBytes, &temp)

	// 判断这个用户是否支付这预测key： cachekey
	paid, payment, err := aiPrediction.
		NewPredictionPaymentLogic(r.Context()).
		ChenckUserPaidPrediction(userAddress, cacheKey)

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {

		} else {
			logger.Errorf("Failed to find payment: %v", err)
			// 未找到预测支付记录
			// 此时返回系统繁忙给前端
			utils.ServerError(w, "System busy")
			return
		}
	}

	// 未开启 x402
	if !h.x402Config.Enable {
		utils.ServerError(w, "System busy")
		return
	}

	if !paid || payment == nil {
		// 返回 x402 状态码给前端
		// 🔑 介入 x402 协议：返回 402 状态码
		logger.Infof("用户 %s 未支付预测 %s，触发 x402 支付流程", userAddress, cacheKey)

		// 设置 http 响应码 为 402 、 支付信息
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Payment-Required", "true")
		w.Header().Set("X-Payment-Memo", cacheKey)
		w.Header().Set("X-Payment-Amount", "0.0001")
		w.Header().Set("X-Payment-Currency", "SOL")
		w.Header().Set("X-Payment-Recipient", h.x402Config.Recipient)
		w.Header().Set("X-Payment-Timestamp", string(time.Now().Unix()))
		w.WriteHeader(http.StatusPaymentRequired)

		// 构建 x402 响应体
		x402Payment := map[string]interface{}{
			"error": "payment required",
		}
		json.NewEncoder(w).Encode(x402Payment)
		return
	}

	// ---- 用户支付了预测

	// 4. 先查缓存
	if cached, ok := h.cache.Get(cacheKey); ok {
		logger.Infof("DeepSeek cache hit: %s", cacheKey)
		w.Header().Set("X-Cache", "HIT")
		if cached.Type == cache.CacheValueJSON {
			w.Header().Set("Content-Type", "application/json")
			w.Write(cached.JsonBody)
		} else {
			h.serveCachedStream(w, r, cached)
		}
		return
	}

	// 5. 缓存未命中，使用单飞模式获取
	logger.Infof("DeepSeek cache miss: %s", cacheKey)
	w.Header().Set("X-Cache", "MISS")

	cacheValue, err := h.singleFlight.Do(cacheKey, func() (*cache.CacheValue, error) {
		// 先再次检查缓存（防止并发时重复构建）
		if cv, ok := h.cache.Get(cacheKey); ok {
			return cv, nil
		}

		if temp.Stream {
			return h.fetchAndCacheStream(cacheKey, bodyBytes)
		}
		return h.fetchAndCacheNonStream(cacheKey, bodyBytes)
	})

	if err != nil {
		logger.Errorf("获取DeepSeek响应失败: %v", err)
		httpx.Error(w, err)
		return
	}

	// 返回响应
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
func (h *DeepSeekProxyHandler) fetchAndCacheStream(cacheKey string, body []byte) (*cache.CacheValue, error) {
	req, err := http.NewRequest("POST", "https://api.deepseek.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
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
		return nil, fmt.Errorf("deepseek returned status %d", resp.StatusCode)
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
	//func (h *DeepSeekProxyHandler) serveCachedStream(w http.ResponseWriter, cv *cache.CacheValue) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no") // 🔑 禁用 Nginx 缓冲
	//w.Header().Set("Transfer-Encoding", "chunked") // 🔑 使用分块传输

	flusher, ok := w.(http.Flusher)
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
			logx.Infof("等待 %.2f ms 后发送第 %d 个事件",
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
		logx.Infof("✅ 已发送第 %d 个事件，实际延迟: %.2f ms",
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
