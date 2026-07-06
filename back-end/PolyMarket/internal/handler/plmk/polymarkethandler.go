// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package plmk

import (
	"X402AiPolyMarket/PolyMarket/internal/types"
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/logic/plmk"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetApiKeyHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.PolymarketCreds
		if err := httpx.Parse(r, &req); err != nil {
			utils.ParamError(w, "Invalid request body")
			return
		}

		userAddress, ok := middleware.GetWalletAddress(r.Context())
		if !ok || userAddress == "" {
			utils.Unauthorized(w, "User not authenticated")
			return
		}

		l := plmk.NewPolymarketL2Logic(r.Context(), svcCtx)
		resp, err := l.CreateApiKey(&req, userAddress)
		if err != nil {
			if customErr, ok := utils.IsCustomError(err); ok {
				utils.Error(w, customErr.Code, customErr.Msg)
			} else {
				utils.ServerError(w, err.Error())
			}
			return
		}

		if resp != nil {
			utils.Success(w, resp)
			return
		}

		resp, err = l.CreateApiKey(&req, userAddress)
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

//func CheckApiKeyHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
//	return func(w http.ResponseWriter, r *http.Request) {
//		var req plmk.CheckApiKeyRequest
//		if err := httpx.Parse(r, &req); err != nil {
//			utils.ParamError(w, "Invalid request body")
//			return
//		}
//
//		l := plmk.NewPolymarketL2Logic(r.Context(), svcCtx)
//		resp, err := l.CheckApiKey(&req)
//		if err != nil {
//			if customErr, ok := utils.IsCustomError(err); ok {
//				utils.Error(w, customErr.Code, customErr.Msg)
//			} else {
//				utils.ServerError(w, err.Error())
//			}
//			return
//		}
//
//		utils.Success(w, resp)
//	}
//}
