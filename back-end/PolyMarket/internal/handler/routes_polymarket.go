package handler

import (
	"X402AiPolyMarket/PolyMarket/internal/handler/plmk"
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"

	"github.com/zeromicro/go-zero/rest"
)

func RegisterPlmkHandlers(server *rest.Server, serverCtx *svc.ServiceContext, middleware *middleware.AuthMiddleware) {

	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/plmk/getApiKey",
				Handler: middleware.Handle(plmk.GetApiKeyHandler(serverCtx)),
			},
			//{
			//	Method:  http.MethodPost,
			//	Path:    "/plmk/checkApiKey",
			//	Handler: middleware.Handle(plmk.CheckApiKeyHandler(serverCtx)),
			//},
		},
		rest.WithTimeout(0),
		rest.WithPrefix("/api/v1"),
	)
}
