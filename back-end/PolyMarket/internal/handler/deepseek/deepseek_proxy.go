package deepseek

import (
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"bufio"
	"bytes"
	"encoding/json"
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

	return &DeepSeekProxyHandler{
		apiKey:       apiKey,
		cache:        chatCache,
		singleFlight: cache.NewSingleFlight(),
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

func (h *DeepSeekProxyHandler) Handle(w http.ResponseWriter, r *http.Request) {
	// 从上下文获取用户地址
	userAddress, ok := middleware.GetWalletAddress(r.Context())
	if !ok || userAddress == "" {
		utils.Unauthorized(w, "User not authenticated")
		return
	}

	// 1. 读取请求体
	bodyBytes, err := io.ReadAll(r.Body)
	//if 1 == 1 {
	//	h.forwardDirectly(w, r, bodyBytes)
	//	return
	//}

	if err != nil {
		httpx.Error(w, err)
		return
	}
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// 2. 生成缓存键
	cacheKey, err := utils.GenerateCacheKey(bodyBytes)
	if err != nil {
		logx.Errorf("生成缓存键失败: %v", err)
		h.forwardDirectly(w, r, bodyBytes) // 降级直接转发
		return
	}

	// 3. 检查是否流式请求
	var temp struct{ Stream bool }
	_ = json.Unmarshal(bodyBytes, &temp)

	// 4. 先查缓存
	if cached, ok := h.cache.Get(cacheKey); ok {
		logx.Infof("DeepSeek cache hit: %s", cacheKey)
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
	logx.Infof("DeepSeek cache miss: %s", cacheKey)
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
		logx.Errorf("获取DeepSeek响应失败: %v", err)
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

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	for i, ev := range cv.Events {
		select {
		case <-r.Context().Done(): // 客户端断开或者超时，立即退出
			return
		default:
		}

		if i > 0 && i < len(cv.Delays) {
			timer := time.NewTimer(cv.Delays[i]) // 按照原延迟等待
			select {
			case <-timer.C:
			case <-r.Context().Done(): // 客户端断开或者超时，停止定时器
				timer.Stop()
				return
			default:
			}
		}
		fmt.Fprintf(w, "data: %s\n\n", ev.Data)
		flusher.Flush()
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
