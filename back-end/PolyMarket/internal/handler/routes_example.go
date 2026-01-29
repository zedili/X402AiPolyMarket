//go:build ignore
// +build ignore

// 这是一个示例文件，展示如何集成 X402 中间件
// 注意：该文件仅用于文档示例，已通过 build tag 排除在编译之外。
// 实际生效的路由定义在 routes.go 中。

package handler

import (
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"

	"github.com/zeromicro/go-zero/rest"
)

func RegisterHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	// 配置 X402 中间件
	x402Config := middleware.X402Config{
		Enabled:   true,
		Amount:    0.001,                         // 0.001 SOL
		Recipient: "YourSolanaWalletAddressHere", // 需要替换为实际的收款地址
		RPCURL:    "https://api.mainnet-beta.solana.com",
	}

	// 使用 X402 中间件包装处理器
	x402Middleware := middleware.X402Middleware(x402Config)

	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/from/:name",
				Handler: x402Middleware(PolyMarketHandler(serverCtx)),
			},
			// 可以添加更多需要支付的路由
			{
				Method:  http.MethodPost,
				Path:    "/ai-prediction",
				Handler: x402Middleware(AIPredictionHandler(serverCtx)),
			},
		},
	)
}
