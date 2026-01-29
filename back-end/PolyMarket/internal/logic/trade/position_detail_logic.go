package trade

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type PositionDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPositionDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PositionDetailLogic {
	return &PositionDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PositionDetailLogic) GetPositionDetail(positionID uint64, userAddress string) (*types.PositionDetailResponse, error) {
	// 查询持仓
	var position model.Position
	if err := model.DB.Where("id = ? AND user_address = ?", positionID, userAddress).First(&position).Error; err != nil {
		logx.Errorf("Position not found: %v", err)
		return nil, utils.NewError(utils.CodeNotFound, "Position not found")
	}

	// 查询市场信息
	var market model.Market
	currentPrice := 0.0
	marketStatus := uint8(0)
	marketQuestion := ""
	
	if err := model.DB.Where("id = ?", position.MarketID).First(&market).Error; err == nil {
		marketQuestion = market.Question
		marketStatus = market.Status
		
		// 根据仓位获取当前价格
		if position.Position == model.PositionYes {
			currentPrice = market.YesPrice
		} else {
			currentPrice = market.NoPrice
		}
	}

	// 计算当前价值和盈亏
	currentValue := position.Shares * currentPrice / 100
	unrealizedPnL := currentValue - position.TotalCost
	unrealizedPnLPct := 0.0
	if position.TotalCost > 0 {
		unrealizedPnLPct = (unrealizedPnL / position.TotalCost) * 100
	}

	return &types.PositionDetailResponse{
		PositionInfo: types.PositionInfo{
			ID:               position.ID,
			MarketID:         position.MarketID,
			MarketQuestion:   marketQuestion,
			MarketStatus:     marketStatus,
			Position:         position.Position,
			PositionName:     getPositionName(position.Position),
			Shares:           position.Shares,
			AvgPrice:         position.AvgPrice,
			TotalCost:        position.TotalCost,
			CurrentPrice:     currentPrice,
			CurrentValue:     currentValue,
			UnrealizedPnL:    unrealizedPnL,
			UnrealizedPnLPct: unrealizedPnLPct,
			RealizedPnL:      position.RealizedPnL,
			IsSettled:        position.IsSettled,
			SettlementValue:  position.SettlementValue,
			CreatedAt:        position.CreatedAt,
		},
		UpdatedAt: position.UpdatedAt,
	}, nil
}

