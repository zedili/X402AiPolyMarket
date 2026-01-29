package market

import (
	"net/http"

	marketlogic "X402AiPolyMarket/PolyMarket/internal/logic/market"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/rest/httpx"
)

type AdminMarketPathRequest struct {
	ID uint64 `path:"id"`
}

// 临时管理员地址（与前端保持一致）
const adminAddress = "0xf0aC9747345c23B6ba451d9103F8C2785800998D"

// checkAdmin 简单校验当前用户是否为管理员
func checkAdmin(r *http.Request, w http.ResponseWriter) (string, bool) {
	addr, ok := middleware.GetWalletAddress(r.Context())
	if !ok || addr == "" {
		utils.Unauthorized(w, "User not authenticated")
		return "", false
	}

	if !utils.EqualAddress(addr, adminAddress) {
		utils.Error(w, utils.CodeForbidden, "Admin permission required")
		return "", false
	}

	return addr, true
}

// AdminApproveMarketHandler 审核通过市场
func AdminApproveMarketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := checkAdmin(r, w); !ok {
			return
		}

		var req AdminMarketPathRequest
		if err := httpx.Parse(r, &req); err != nil {
			utils.ParamError(w, "Invalid market id")
			return
		}

		l := marketlogic.NewAdminMarketLogic(r.Context(), svcCtx)
		if err := l.ApproveMarket(req.ID); err != nil {
			if customErr, ok := utils.IsCustomError(err); ok {
				utils.Error(w, customErr.Code, customErr.Msg)
			} else {
				utils.ServerError(w, err.Error())
			}
			return
		}

		utils.Success(w, map[string]interface{}{
			"market_id": req.ID,
			"status":    "approved",
		})
	}
}

// AdminRejectMarketHandler 审核拒绝市场
func AdminRejectMarketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := checkAdmin(r, w); !ok {
			return
		}

		var req AdminMarketPathRequest
		if err := httpx.Parse(r, &req); err != nil {
			utils.ParamError(w, "Invalid market id")
			return
		}

		l := marketlogic.NewAdminMarketLogic(r.Context(), svcCtx)
		if err := l.RejectMarket(req.ID); err != nil {
			if customErr, ok := utils.IsCustomError(err); ok {
				utils.Error(w, customErr.Code, customErr.Msg)
			} else {
				utils.ServerError(w, err.Error())
			}
			return
		}

		utils.Success(w, map[string]interface{}{
			"market_id": req.ID,
			"status":    "rejected",
		})
	}
}

// AdminSettleMarketHandler 强制结算市场
func AdminSettleMarketHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := checkAdmin(r, w); !ok {
			return
		}

		var req AdminMarketPathRequest
		if err := httpx.Parse(r, &req); err != nil {
			utils.ParamError(w, "Invalid market id")
			return
		}

		l := marketlogic.NewAdminMarketLogic(r.Context(), svcCtx)
		if err := l.SettleMarket(req.ID); err != nil {
			if customErr, ok := utils.IsCustomError(err); ok {
				utils.Error(w, customErr.Code, customErr.Msg)
			} else {
				utils.ServerError(w, err.Error())
			}
			return
		}

		utils.Success(w, map[string]interface{}{
			"market_id": req.ID,
			"status":    "settled",
		})
	}
}
