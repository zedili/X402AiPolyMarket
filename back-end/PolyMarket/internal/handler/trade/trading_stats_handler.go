package trade

import (
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/logic/trade"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

func TradingStatsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 从上下文获取用户地址
		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := trade.NewTradingStatsLogic(r.Context(), svcCtx)
		resp, err := l.GetTradingStats(userAddress)
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

