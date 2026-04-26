package market

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type HotMarketsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewHotMarketsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *HotMarketsLogic {
	return &HotMarketsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *HotMarketsLogic) GetHotMarkets(limit int) ([]types.MarketListItem, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	// 查询热门市场
	var markets []model.Market
	if err := model.DB.Where("is_hot = ? AND audit_status = ? AND status = ?",
		true, model.AuditStatusApproved, model.MarketStatusActive).
		Order("total_volume DESC").
		Limit(limit).
		Find(&markets).Error; err != nil {
		logx.Errorf("Failed to query hot markets: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to query hot markets")
	}

	// 转换为响应格式
	result := make([]types.MarketListItem, 0, len(markets))
	for _, m := range markets {
		item := types.MarketListItem{
			ID:               m.ID,
			Question:         m.Question,
			Description:      m.Description,
			Category:         m.Category,
			CreatorAddress:   m.CreatorAddress,
			ContractAddress:  m.ContractAddress,
			YesPrice:         m.YesPrice,
			NoPrice:          m.NoPrice,
			TotalVolume:      m.TotalVolume,
			TotalLiquidity:   m.TotalLiquidity,
			ParticipantCount: m.ParticipantCount,
			AIPrediction:     m.AIPrediction,
			Confidence:       m.Confidence,
			Suggests:         m.Suggests,
			StartTime:        m.StartTime,
			EndTime:          m.EndTime,
			Status:           m.Status,
			IsHot:            m.IsHot,
			IsFeatured:       m.IsFeatured,
			CreatedAt:        m.CreatedAt,
		}
		result = append(result, item)
	}

	return result, nil
}

