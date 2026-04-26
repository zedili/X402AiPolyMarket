package trade

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type OrderListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewOrderListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *OrderListLogic {
	return &OrderListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *OrderListLogic) GetOrderList(req *types.OrderListRequest, userAddress string) (*types.OrderListResponse, error) {
	// 设置默认分页参数
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 || req.PageSize > 100 {
		req.PageSize = 20
	}

	// 构建查询
	query := model.DB.Model(&model.Order{}).Where("user_address = ?", userAddress)

	// 筛选条件
	if req.MarketID != nil {
		query = query.Where("market_id = ?", *req.MarketID)
	}
	if req.Status != nil {
		query = query.Where("status = ?", *req.Status)
	}
	if req.OrderType != nil {
		query = query.Where("order_type = ?", *req.OrderType)
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logx.Errorf("Failed to count orders: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to get order count")
	}

	// 分页查询
	var orders []model.Order
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&orders).Error; err != nil {
		logx.Errorf("Failed to query orders: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to get orders")
	}

	// 获取市场信息
	marketIDs := make([]uint64, 0, len(orders))
	for _, order := range orders {
		marketIDs = append(marketIDs, order.MarketID)
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
	orderInfos := make([]types.OrderInfo, 0, len(orders))
	for _, order := range orders {
		orderInfo := types.OrderInfo{
			ID:             order.ID,
			MarketID:       order.MarketID,
			OrderType:      order.OrderType,
			OrderTypeName:  getOrderTypeName(order.OrderType),
			Position:       order.Position,
			PositionName:   getPositionName(order.Position),
			Amount:         order.Amount,
			Price:          order.Price,
			TotalValue:     order.TotalValue,
			Fee:            order.Fee,
			FilledAmount:   order.FilledAmount,
			AvgFilledPrice: order.AvgFilledPrice,
			Status:         order.Status,
			StatusName:     getOrderStatusName(order.Status),
			TxHash:         order.TxHash,
			CreatedAt:      order.CreatedAt,
		}

		// 添加市场问题
		if market, ok := marketMap[order.MarketID]; ok {
			orderInfo.MarketQuestion = market.Question
		}

		orderInfos = append(orderInfos, orderInfo)
	}

	return &types.OrderListResponse{
		Total:  total,
		Orders: orderInfos,
	}, nil
}

// 辅助函数
func getOrderTypeName(orderType uint8) string {
	switch orderType {
	case model.OrderTypeBuy:
		return "Buy"
	case model.OrderTypeSell:
		return "Sell"
	default:
		return "Unknown"
	}
}

func getPositionName(position uint8) string {
	switch position {
	case model.PositionNo:
		return "NO"
	case model.PositionYes:
		return "YES"
	default:
		return "Unknown"
	}
}

func getOrderStatusName(status uint8) string {
	switch status {
	case model.OrderStatusPending:
		return "Pending"
	case model.OrderStatusPartiallyFilled:
		return "Partially Filled"
	case model.OrderStatusFilled:
		return "Filled"
	case model.OrderStatusCancelled:
		return "Cancelled"
	default:
		return "Unknown"
	}
}

