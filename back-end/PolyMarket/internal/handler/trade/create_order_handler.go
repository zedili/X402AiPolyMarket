package trade

import (
	"X402AiPolyMarket/PolyMarket/internal/logic/plmk"
	"encoding/json"
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/logic/trade"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

func CreateOrderHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateOrderRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.ParamError(w, "Invalid request body")
			return
		}

		// 检查后端是否缓存 API Key
		apiKey, err2 := plmk.NewPolymarketL2Logic(r.Context(), svcCtx).
			GetL2AccountByWallet(req.Creds.GetAddress())

		// 如果没有缓存，则创建
		if apiKey == nil || err2 != nil {
			userAddress, b := middleware.GetWalletAddress(r.Context())
			if !b {
				utils.Unauthorized(w, "User not authenticated")
				return
			}
			apiKey, err2 = plmk.NewPolymarketL2Logic(r.Context(), svcCtx).
				CreateApiKey(&req.Creds, userAddress)

			if err2 != nil {
				utils.ServerError(w, err2.Error())
				return
			}
		}

		// 获取用户地址
		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := trade.NewCreateOrderLogic(r.Context(), svcCtx)
		resp, err := l.CreateOrder(&req, userAddress)
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
