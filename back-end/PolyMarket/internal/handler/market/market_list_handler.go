package market

import (
	"net/http"
	"strconv"

	"X402AiPolyMarket/PolyMarket/internal/logic/market"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

func MarketListHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 解析查询参数
		query := r.URL.Query()
		
		req := &types.MarketListRequest{}
		
		// Page
		if pageStr := query.Get("page"); pageStr != "" {
			if page, err := strconv.Atoi(pageStr); err == nil {
				req.Page = page
			}
		}
		
		// PageSize
		if pageSizeStr := query.Get("page_size"); pageSizeStr != "" {
			if pageSize, err := strconv.Atoi(pageSizeStr); err == nil {
				req.PageSize = pageSize
			}
		}
		
		// Category
		if category := query.Get("category"); category != "" {
			req.Category = &category
		}
		
		// Status
		if statusStr := query.Get("status"); statusStr != "" {
			if status, err := strconv.ParseUint(statusStr, 10, 8); err == nil {
				statusUint8 := uint8(status)
				req.Status = &statusUint8
			}
		}
		
		// Sort
		if sort := query.Get("sort"); sort != "" {
			req.Sort = &sort
		}
		
		// Order
		if order := query.Get("order"); order != "" {
			req.Order = &order
		}
		
		// Search
		if search := query.Get("search"); search != "" {
			req.Search = &search
		}

		// IsHot
		if isHotStr := query.Get("is_hot"); isHotStr != "" {
			if isHot, err := strconv.ParseBool(isHotStr); err == nil {
				req.IsHot = &isHot
			}
		}

		// PendingOnly
		if pendingOnlyStr := query.Get("pending_only"); pendingOnlyStr != "" {
			if pendingOnly, err := strconv.ParseBool(pendingOnlyStr); err == nil {
				req.PendingOnly = &pendingOnly
			}
		}

		// AdminAddress
		if adminAddr := query.Get("admin_address"); adminAddr != "" {
			req.AdminAddress = &adminAddr
		}

		l := market.NewMarketListLogic(r.Context(), svcCtx)
		resp, err := l.GetMarketList(req)
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

