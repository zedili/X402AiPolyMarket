package trade

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type PositionListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPositionListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PositionListLogic {
	return &PositionListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PositionListLogic) GetPositionList(req *types.PositionListRequest, userAddress string) (*types.PositionListResponse, error) {
	// 构建查询
	query := model.DB.Model(&model.Position{}).Where("user_address = ?", userAddress)

	// 筛选条件
	if req.Status == "active" {
		query = query.Where("is_settled = ?", false).Where("shares > 0")
	} else if req.Status == "settled" {
		query = query.Where("is_settled = ?", true)
	}

	// 查询持仓
	var positions []model.Position
	if err := query.Order("created_at DESC").Find(&positions).Error; err != nil {
		logx.Errorf("Failed to query positions: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to get positions")
	}

	// 获取市场信息
	marketIDs := make([]uint64, 0, len(positions))
	for _, pos := range positions {
		marketIDs = append(marketIDs, pos.MarketID)
	}

	var markets []model.Market
	marketMap := make(map[uint64]*model.Market)
	if len(marketIDs) > 0 {
		if err := model.DB.Where("id IN ?", marketIDs).Find(&markets).Error; err == nil {
			for i := range markets {
				marketMap[markets[i].ID] = &markets[i]
			}
		}
	}

	// 转换为响应格式
	positionInfos := make([]types.PositionInfo, 0, len(positions))
	for _, pos := range positions {
		// 获取当前价格
		currentPrice := 0.0
		marketStatus := uint8(0)
		marketQuestion := ""
		
		if market, ok := marketMap[pos.MarketID]; ok {
			marketQuestion = market.Question
			marketStatus = market.Status
			
			// 根据仓位获取当前价格
			if pos.Position == model.PositionYes {
				currentPrice = market.YesPrice
			} else {
				currentPrice = market.NoPrice
			}
		}

		// 计算当前价值和盈亏
		currentValue := pos.Shares * currentPrice / 100
		unrealizedPnL := currentValue - pos.TotalCost
		unrealizedPnLPct := 0.0
		if pos.TotalCost > 0 {
			unrealizedPnLPct = (unrealizedPnL / pos.TotalCost) * 100
		}

		positionInfo := types.PositionInfo{
			ID:               pos.ID,
			MarketID:         pos.MarketID,
			MarketQuestion:   marketQuestion,
			MarketStatus:     marketStatus,
			Position:         pos.Position,
			PositionName:     getPositionName(pos.Position),
			Shares:           pos.Shares,
			AvgPrice:         pos.AvgPrice,
			TotalCost:        pos.TotalCost,
			CurrentPrice:     currentPrice,
			CurrentValue:     currentValue,
			UnrealizedPnL:    unrealizedPnL,
			UnrealizedPnLPct: unrealizedPnLPct,
			RealizedPnL:      pos.RealizedPnL,
			IsSettled:        pos.IsSettled,
			SettlementValue:  pos.SettlementValue,
			CreatedAt:        pos.CreatedAt,
		}

		positionInfos = append(positionInfos, positionInfo)
	}

	return &types.PositionListResponse{
		Positions: positionInfos,
	}, nil
}

