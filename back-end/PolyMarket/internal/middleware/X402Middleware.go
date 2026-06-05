package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/config"

	x402 "github.com/x402-foundation/x402/go"
	x402http "github.com/x402-foundation/x402/go/http"
	evm "github.com/x402-foundation/x402/go/mechanisms/evm/exact/server"
	"github.com/zeromicro/go-zero/core/logx"
)

const (
	X402Verified           = "X402Verified"
	X402SettleSuccess      = "X402SettleSuccess"
	CheckCacheKeyPayStatus = "CheckCacheKeyPayStatus"
	CacheKeyPaid           = "CacheKeyPaid"
)

// X402Middleware x402 支付中间件
func X402Middleware(x402Config config.X402Config) func(http.HandlerFunc) http.HandlerFunc {
	// ========== x402 配置初始化 ==========

	// 1. 从配置文件获取 Facilitator URL
	facilitatorURL := x402Config.FacilitatorUrl
	if facilitatorURL == "" {
		// 默认使用 Amoy testnet
		facilitatorURL = "https://x402-amoy.polygon.technology"
	}

	// 2. 创建 Facilitator 客户端
	facilitatorClient := x402http.NewHTTPFacilitatorClient(&x402http.FacilitatorConfig{
		//facilitatorClient := NewFixedFacilitatorClient(&FixedFacilitatorConfig{
		URL: facilitatorURL,
		HTTPClient: &http.Client{
			Transport: &debugTransport{
				transport: http.DefaultTransport,
			},
		},
	})

	// 3. 获取默认的 network 和 scheme
	defaultNetwork := x402Config.DefaultNetwork
	if defaultNetwork == "" {
		defaultNetwork = "eip155:80002" // Amoy testnet
	}

	defaultScheme := x402Config.DefaultScheme
	if defaultScheme == "" {
		defaultScheme = "exact"
	}

	// 5. 转换路由配置（从 config 转换为 middleware 需要的格式）
	routesConfig := make(x402http.RoutesConfig)
	for path, cfg := range x402Config.Routes {
		fmt.Printf("  📌 Loading route: %s\n", path)
		// 转换 Accepts 配置
		accepts := make([]x402http.PaymentOption, len(cfg.Accepts))
		for i, accept := range cfg.Accepts {
			fmt.Printf("     - Accept: Scheme=%s, Network=%s, Price=%s, PayTo=%s\n",
				accept.Scheme, accept.Network, accept.Price, accept.PayTo)
			accepts[i] = x402http.PaymentOption{
				Scheme:  accept.Scheme,
				Network: x402.Network(accept.Network),
				PayTo:   accept.PayTo,
				Price: map[string]interface{}{
					"amount": accept.Price, // 字符串，如 "1000"
					"asset":  accept.Asset, // 必须指定资产
				},
				Extra: map[string]interface{}{
					"name":    accept.Extra.Name,
					"version": accept.Extra.Version,
				},
			}
		}
		// 构建路由配置
		routeConfig := x402http.RouteConfig{
			Accepts:     accepts,
			Description: cfg.Description,
			MimeType:    cfg.MimeType,
		}
		routesConfig[path] = routeConfig
	}

	// 创建 x402 服务器并注册支付方案
	fmt.Printf("🔧 Registering Scheme Server for Network: %s\n", defaultNetwork)
	x402Server := x402http.Newx402HTTPResourceServer(
		routesConfig,
		x402.WithFacilitatorClient(facilitatorClient),
		x402.WithSchemeServer(x402.Network(defaultNetwork), evm.NewExactEvmScheme()),
		// 根据需要添加 SVM, AVM 的方案
	)

	// 初始化 x402 服务器
	initctx, initcancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer initcancel()
	fmt.Printf("⏳ Initializing x402 Server...\n")
	if err := x402Server.Initialize(initctx); err != nil {
		fmt.Printf("❌ x402 init failed: %v\n", err)
		log.Fatal(err) // 或 return 一个错误中间件
	}
	fmt.Printf("✅ x402 Server Initialized Successfully!\n")

	// Go 闭包：本质是一个函数字面量（匿名函数），类似Java语言中的匿名内部类,但更
	//✅️高效：不会隐式持有class引用
	//✅️安全、可控：仅捕获实际用到的变量
	//✅️可修改：变量传递的是引用，✅️可读、✅️可写，无限制
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {

			logger := logx.WithContext(r.Context())

			x402ReqCtx := x402http.HTTPRequestContext{
				// 📌 利用 go 内嵌模式对 req 进行包装、增强
				Adapter: &x402Adapter{req: r},
				Path:    r.URL.Path,
				Method:  r.Method,
			}

			// ✅ 为每个请求创建独立的 context，避免共享已取消的上下文
			reqCtx, reqCancel := context.WithTimeout(r.Context(), 30*time.Second)
			defer reqCancel()
			// 无需支付，继续执行业务逻辑
			// 把 verifyed 验证成功的状态，写到上下文中，以便后续处理
			// 先检查支付状态
			logger.Infof("⚙️ checking pay status")
			// 支付成功，继续执行业务逻辑
			// 📌 创建 capture 并替换 w
			capture := ResponseCapture{
				ResponseWriter: w,
				//body:           &bytes.Buffer{},
				//statusCode:     200,
				X402Status: CheckCacheKeyPayStatus, // 请求刚进来时，默认为检查支付状态
			}
			w = &capture
			next(w, r)
			if capture.X402Status == CacheKeyPaid {
				//	如果状态已经为 paid，则直接返回
				logger.Infof("✅ cachekey paid\n")
				return
			}
			logger.Infof("⚙️  Processing x402 Payment...\n")
			x402ServerResult := x402Server.ProcessHTTPRequest(reqCtx, x402ReqCtx, nil)
			logger.Infof("🏁 x402 Result Type: %v\n", x402ServerResult.Type)

			switch x402ServerResult.Type {
			case x402http.ResultNoPaymentRequired:
				// 无需支付，继续执行业务逻辑
				next(w, r)
			case x402http.ResultPaymentError:
				// 支付错误，返回错误信息 或 支付信息
				// 打印完整的错误响应体，通常包含失败原因
				logger.Infof("❌ Payment Error Body: %+v\n", x402ServerResult.Response.Body)
				logger.Infof("❌ Payment Error Headers: %+v\n", x402ServerResult.Response.Headers)
				handlePaymentError(w, x402ServerResult.Response)
			case x402http.ResultPaymentVerified:

				// 📌 执行业务逻辑
				// 把 verifyed 验证成功的状态，写到上下文中，以便后续处理
				capture.X402Status = X402Verified
				next(w, r)
				// 打印处理结果
				logger.Infof("✅ Payment Verified Body: %+v\n", x402ServerResult.Response)

				// ✅️ 业务逻辑执行成功，进行结算
				processSettleResult := x402Server.ProcessSettlement(
					reqCtx,                                //1. ctx
					*x402ServerResult.PaymentPayload,      //2. PaymentPayload
					*x402ServerResult.PaymentRequirements, //3. Requirements
					nil,                                   //4.overrides - 无需覆盖则设置为 nil
					nil,                                   //5. transportContext  - 简单场景下可以设置为 nil
					nil,                                   //6. declaredExtensions - 无需声明扩展则设置为 nil
				)

				// ❌️ 结算失败，返回错误信息
				if !processSettleResult.Success {
					logger.Infof("❌ Settlement failed: %s\n", processSettleResult.ErrorReason)
					return
				}

				// ✅️ 结算成功，返回结果
				logger.Infof("✅️ Settlement succeeded: %s", processSettleResult.Transaction)

				capture.X402Status = X402SettleSuccess               // 状态为已结算
				capture.X402TxHash = processSettleResult.Transaction // 保存交易哈希 到 capture

				// 📌 执行业务逻辑
				next(w, r)
				// 打印处理结果
				logger.Infof("✅ Payment Verified Headers: %+v\n", w.Header())

				// 添加结算头，响应结果
				if processSettleResult.Headers != nil {
					for key, value := range processSettleResult.Headers {
						w.Header().Add(key, value)

						// 结算响应头
						logger.Infof("✅ Settle Result Header: %s : %s\n", key, value)
					}
				}

			}
		}
	}
}

func handlePaymentError(w http.ResponseWriter, response *x402http.HTTPResponseInstructions) {

	// Set headers (includes x402 payment requirements)
	for key, value := range response.Headers {
		w.Header().Set(key, value)
	}

	if response.IsHTML {
		// HTML 响应（通常用于浏览器展示支付墙）
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(response.Status)

		// 提取 HTML 字符串
		bodyStr, ok := response.Body.(string)
		if !ok {
			// 容错处理：若 Body 不是字符串，则尝试转换为字符串
			bodyStr = fmt.Sprint(response.Body)
		}
		_, _ = w.Write([]byte(bodyStr))
	} else {
		// JSON 响应（面向 API 客户端）
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(response.Status)

		// 序列化并写入 JSON 数据
		if err := json.NewEncoder(w).Encode(response.Body); err != nil {
			// 序列化失败时回退到 500 错误（避免响应不完整）
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	}
}

func GetX402Status(w http.ResponseWriter) string {
	if capture, ok := w.(*ResponseCapture); ok {
		return capture.X402Status
	}
	return ""
}

func SetX402Status(w http.ResponseWriter, status string) {
	if capture, ok := w.(*ResponseCapture); ok {
		capture.X402Status = status
	}
}

func GetX402TxHash(w http.ResponseWriter) string {
	if capture, ok := w.(*ResponseCapture); ok {
		return capture.X402TxHash
	}
	return ""
}

type x402Adapter struct {
	req *http.Request
}

func (x *x402Adapter) GetMethod() string { return x.req.Method }
func (x *x402Adapter) GetPath() string   { return x.req.URL.Path }
func (x *x402Adapter) GetURL() string    { return x.req.URL.String() }
func (x *x402Adapter) GetAcceptHeader() string {
	return x.req.Header.Get("Accept")
}
func (x *x402Adapter) GetUserAgent() string {
	return x.req.Header.Get("User-Agent")
}
func (x *x402Adapter) GetHeader(name string) string {
	return x.req.Header.Get(name)
}

type ResponseCapture struct {
	// 📚 📌 嵌入机制，会自动将类型的方法“提升”到外层结构体中
	// 📌 提升是根据“类型”（即声明的类型），和 运行时指向的实例无关
	// ✅️ 简洁，只需要重写需要的方法
	// ✅️ 其他方法自动委托给 http.ResponseWriter
	// ✅️ 保持原始行为不变
	// ❌️代码冗余
	// ❌️ 容易遗漏方法
	http.ResponseWriter
	//body       *bytes.Buffer
	//statusCode int
	X402Status string
	X402TxHash string
}

func (w *ResponseCapture) Flusher() (http.Flusher, bool) {
	// 📌 类型断言：从接口类型中提取底层具体类型、或其他类型。类似 Java 中的： instance of + 强转
	flusher, ok := w.ResponseWriter.(http.Flusher)
	return flusher, ok
}

//func (w *responseCapture) WriteHeader(code int) {
//	w.statusCode = code
//}
//func (w *responseCapture) Write(data []byte) (int, error) {
//	return w.body.Write(data)
//}

// 包装 RoundTripper 用于打印 HTTP 交互
type debugTransport struct {
	transport http.RoundTripper
}

func (t *debugTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	reqDump, _ := httputil.DumpRequestOut(req, true)
	fmt.Printf("=== Facilitator Request ===\n%s\n", reqDump)

	resp, err := t.transport.RoundTrip(req)
	if err != nil {
		fmt.Printf("=== Facilitator Error: %v ===\n", err)
		return nil, err
	}

	respDump, _ := httputil.DumpResponse(resp, true)
	fmt.Printf("=== Facilitator Response ===\n%s\n", respDump)
	return resp, err
}
