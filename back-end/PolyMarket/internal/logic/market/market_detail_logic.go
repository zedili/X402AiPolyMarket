package market

import (
	"context"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

type MarketDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMarketDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MarketDetailLogic {
	return &MarketDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MarketDetailLogic) GetMarketDetail(marketID uint64, userAddress *string) (*types.MarketDetailResponse, error) {
	// 查询市场
	var market model.Market
	if err := model.DB.Where("id = ?", marketID).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, utils.NewError(utils.CodeNotFound, "Market not found")
		}
		logx.Errorf("Failed to query market: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to query market")
	}

	// 基于时间和审核状态的自动状态迁移（轻量级，无需额外定时任务）：
	// - 已审核 & 仍是 Pending 且当前时间 >= start_time，则视为 Active
	// - 任意状态下，如果当前时间 > end_time 且尚未结算，则视为 Ended
	now := time.Now()
	derivedStatus := market.Status
	if market.AuditStatus == model.AuditStatusApproved && market.Status == model.MarketStatusPending && !now.Before(market.StartTime) {
		derivedStatus = model.MarketStatusActive
	}
	if derivedStatus == model.MarketStatusActive && now.After(*market.EndTime) && market.Status != model.MarketStatusSettled {
		derivedStatus = model.MarketStatusEnded
	}

	// 构建响应
	resp := &types.MarketDetailResponse{
		ID:               market.ID,
		Question:         market.Question,
		Description:      market.Description,
		Category:         market.Category,
		CreatorAddress:   market.CreatorAddress,
		ContractAddress:  market.ContractAddress,
		YesPrice:         market.YesPrice,
		NoPrice:          market.NoPrice,
		YesShares:        market.YesShares,
		NoShares:         market.NoShares,
		TotalVolume:      market.TotalVolume,
		TotalLiquidity:   market.TotalLiquidity,
		ParticipantCount: market.ParticipantCount,
		AIPrediction:     market.AIPrediction,
		Confidence:       market.Confidence,
		Suggests:         market.Suggests,
		StartTime:        market.StartTime,
		EndTime:          *market.EndTime,
		SettlementTime:   market.SettlementTime,
		Status:           derivedStatus,
		Result:           market.Result,
		AuditStatus:      market.AuditStatus,
		IsHot:            market.IsHot,
		IsFeatured:       market.IsFeatured,
		Tags:             market.Tags,
		Metadata:         market.Metadata,
		CreatedAt:        market.CreatedAt,
		UpdatedAt:        market.UpdatedAt,
	}

	// 如果提供了用户地址，检查是否收藏
	if userAddress != nil && *userAddress != "" {
		normalizedAddress := utils.NormalizeAddress(*userAddress)
		var count int64
		model.DB.Model(&model.MarketFavorite{}).
			Where("user_address = ? AND market_id = ?", normalizedAddress, marketID).
			Count(&count)
		isFavorited := count > 0
		resp.IsFavorited = &isFavorited
	}

	return resp, nil
}
