package user

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"

	"X402AiPolyMarket/PolyMarket/internal/logic/user"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"
)

type GetPublicUserReq struct {
	Address string `path:"address"`
}

func GetPublicUserHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		var req GetPublicUserReq
		if err := httpx.Parse(r, &req); err != nil {
			utils.ParamError(w, err.Error())
			return
		}

		if req.Address == "" {
			utils.ParamError(w, "Missing address parameter")
			return
		}

		l := user.NewPublicUserLogic(r.Context(), svcCtx)
		resp, err := l.GetPublicUser(req.Address)
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
