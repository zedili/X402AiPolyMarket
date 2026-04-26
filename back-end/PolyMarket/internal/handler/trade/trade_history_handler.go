package trade

import (
	"net/http"
	"strconv"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/logic/trade"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

func TradeHistoryHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.TradeHistoryRequest

		// 解析查询参数
		query := r.URL.Query()
		req.Page, _ = strconv.Atoi(query.Get("page"))
		req.PageSize, _ = strconv.Atoi(query.Get("page_size"))

		if marketID := query.Get("market_id"); marketID != "" {
			if id, err := strconv.ParseUint(marketID, 10, 64); err == nil {
				req.MarketID = &id
			}
		}

		if startTime := query.Get("start_time"); startTime != "" {
			if t, err := time.Parse(time.RFC3339, startTime); err == nil {
				req.StartTime = &t
			}
		}

		if endTime := query.Get("end_time"); endTime != "" {
			if t, err := time.Parse(time.RFC3339, endTime); err == nil {
				req.EndTime = &t
			}
		}

		// 从上下文获取用户地址
		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := trade.NewTradeHistoryLogic(r.Context(), svcCtx)
		resp, err := l.GetTradeHistory(&req, userAddress)
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

