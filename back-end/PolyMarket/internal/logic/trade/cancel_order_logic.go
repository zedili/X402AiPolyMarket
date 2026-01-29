package trade

import (
	"context"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type CancelOrderLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCancelOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CancelOrderLogic {
	return &CancelOrderLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CancelOrderLogic) CancelOrder(orderID uint64, userAddress string) (*types.CancelOrderResponse, error) {
	// 查询订单
	var order model.Order
	if err := model.DB.Where("id = ? AND user_address = ?", orderID, userAddress).First(&order).Error; err != nil {
		logx.Errorf("Order not found: %v", err)
		return nil, utils.NewError(utils.CodeNotFound, "Order not found")
	}

	// 检查订单状态
	if order.Status == model.OrderStatusFilled {
		return nil, utils.NewError(utils.CodeParamError, "Cannot cancel filled order")
	}
	if order.Status == model.OrderStatusCancelled {
		return nil, utils.NewError(utils.CodeParamError, "Order already cancelled")
	}

	// 更新订单状态
	now := time.Now()
	order.Status = model.OrderStatusCancelled
	order.CancelledAt = &now

	if err := model.DB.Save(&order).Error; err != nil {
		logx.Errorf("Failed to cancel order: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to cancel order")
	}

	// TODO: 如果有部分成交，需要退还未成交部分的资金

	return &types.CancelOrderResponse{
		OrderID:     order.ID,
		Status:      order.Status,
		CancelledAt: *order.CancelledAt,
	}, nil
}

