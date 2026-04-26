package market

import (
	"context"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

// AdminMarketLogic 管理员市场操作逻辑（审核、强制结算等）
type AdminMarketLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAdminMarketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AdminMarketLogic {
	return &AdminMarketLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// ApproveMarket 审核通过市场
func (l *AdminMarketLogic) ApproveMarket(marketID uint64) error {
	var market model.Market
	if err := model.DB.Where("id = ?", marketID).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NewError(utils.CodeMarketNotFound, "Market not found")
		}
		logx.Errorf("Failed to find market for approve: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to approve market")
	}

	// 更新审核状态为已通过，并根据时间自动切换业务状态：
	// - 默认创建时为 Pending（待开始）
	// - 如果当前时间已到达或超过开始时间，则自动切换为 Active（进行中）
	updates := map[string]interface{}{
		"audit_status": model.AuditStatusApproved,
	}

	// 仅当市场仍处于 Pending 状态时才考虑自动激活，避免覆盖已手动设置的状态
	now := time.Now()
	if market.Status == model.MarketStatusPending && now.After(market.StartTime) {
		updates["status"] = model.MarketStatusActive
	}

	if err := model.DB.Model(&market).Updates(updates).Error; err != nil {
		logx.Errorf("Failed to update market audit status / status on approve: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to approve market")
	}

	return nil
}

// RejectMarket 审核拒绝市场
func (l *AdminMarketLogic) RejectMarket(marketID uint64) error {
	var market model.Market
	if err := model.DB.Where("id = ?", marketID).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NewError(utils.CodeMarketNotFound, "Market not found")
		}
		logx.Errorf("Failed to find market for reject: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to reject market")
	}

	// 更新审核状态为已拒绝
	if err := model.DB.Model(&market).Update("audit_status", model.AuditStatusRejected).Error; err != nil {
		logx.Errorf("Failed to update market audit status to rejected: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to reject market")
	}

	return nil
}

// SettleMarket 强制结算市场（简单版本：仅标记为已结算并设置结算时间）
func (l *AdminMarketLogic) SettleMarket(marketID uint64) error {
	var market model.Market
	if err := model.DB.Where("id = ?", marketID).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.NewError(utils.CodeMarketNotFound, "Market not found")
		}
		logx.Errorf("Failed to find market for settle: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to settle market")
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":          model.MarketStatusSettled,
		"settlement_time": &now,
	}

	if err := model.DB.Model(&market).Updates(updates).Error; err != nil {
		logx.Errorf("Failed to force settle market: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to settle market")
	}

	return nil
}
