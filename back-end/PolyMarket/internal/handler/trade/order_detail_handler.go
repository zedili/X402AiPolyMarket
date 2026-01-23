package trade

import (
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/logic/trade"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/rest/httpx"
)

type OrderDetailRequest struct {
	ID uint64 `path:"id"`
}

func OrderDetailHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req OrderDetailRequest
		if err := httpx.Parse(r, &req); err != nil {
			utils.ParamError(w, "Invalid order ID")
			return
		}

		// 从上下文获取用户地址
		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := trade.NewOrderDetailLogic(r.Context(), svcCtx)
		resp, err := l.GetOrderDetail(req.ID, userAddress)
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

