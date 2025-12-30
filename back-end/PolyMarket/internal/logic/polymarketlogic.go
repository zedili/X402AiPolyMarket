// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package logic

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type PolyMarketLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPolyMarketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PolyMarketLogic {
	return &PolyMarketLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PolyMarketLogic) PolyMarket(req *types.Request) (resp *types.Response, err error) {
	// todo: add your logic here and delete this line
    resp = new(types.Response)
    resp.Message = req.Name
	return
}
