package trade

import (
	"net/http"
	"strconv"

	"X402AiPolyMarket/PolyMarket/internal/logic/trade"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

func OrderListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.OrderListRequest

		// 解析查询参数
		query := r.URL.Query()
		req.Page, _ = strconv.Atoi(query.Get("page"))
		req.PageSize, _ = strconv.Atoi(query.Get("page_size"))

		if marketID := query.Get("market_id"); marketID != "" {
			if id, err := strconv.ParseUint(marketID, 10, 64); err == nil {
				req.MarketID = &id
			}
		}

		if status := query.Get("status"); status != "" {
			if s, err := strconv.ParseUint(status, 10, 8); err == nil {
				st := uint8(s)
				req.Status = &st
			}
		}

		if orderType := query.Get("order_type"); orderType != "" {
			if ot, err := strconv.ParseUint(orderType, 10, 8); err == nil {
				ott := uint8(ot)
				req.OrderType = &ott
			}
		}

		// 从上下文获取用户地址
		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := trade.NewOrderListLogic(r.Context(), svcCtx)
		resp, err := l.GetOrderList(&req, userAddress)
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

