package trade

import (
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/logic/trade"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

func PositionListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.PositionListRequest

		// 解析查询参数
		query := r.URL.Query()
		req.Status = query.Get("status")

		// 从上下文获取用户地址
		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := trade.NewPositionListLogic(r.Context(), svcCtx)
		resp, err := l.GetPositionList(&req, userAddress)
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

