package market

import (
	"encoding/json"
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/logic/market"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

func CreateMarketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateMarketRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.ParamError(w, "Invalid request body")
			return
		}

		// 从上下文获取用户地址（由认证中间件设置）
		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := market.NewCreateMarketLogic(r.Context(), svcCtx)
		resp, err := l.CreateMarket(&req, userAddress)
		if err != nil {
			if customErr, ok := utils.IsCustomError(err); ok {
				utils.Error(w, customErr.Code, customErr.Msg)
			} else {
				utils.ServerError(w, err.Error())
			}
			return
		}

		utils.Success(w, resp)
	}
}
