package market

import (
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/logic/market"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/rest/httpx"
)

type MarketDetailRequest struct {
	ID uint64 `path:"id"`
}

func MarketDetailHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req MarketDetailRequest
		if err := httpx.Parse(r, &req); err != nil {
			utils.ParamError(w, "Invalid market ID")
			return
		}

		// 尝试从上下文获取用户地址（可选）
		var userAddress *string
		if addr, ok := middleware.GetWalletAddress(r.Context()); ok && addr != "" {
			userAddress = &addr
		}

		l := market.NewMarketDetailLogic(r.Context(), svcCtx)
		resp, err := l.GetMarketDetail(req.ID, userAddress)
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

