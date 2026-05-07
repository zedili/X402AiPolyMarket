package trade

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateOrderLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateOrderLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateOrderLogic {
	return &CreateOrderLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateOrderLogic) CreateOrder(req *types.CreateOrderRequest, userAddress string) (*types.CreateOrderResponse, error) {
	// 1. 验证市场是否存在且可交易
	var market model.Market
	if err := model.DB.Where("id = ?", req.MarketID).First(&market).Error; err != nil {
		logx.Errorf("Market not found: %v", err)
		return nil, utils.NewError(utils.CodeNotFound, "Market not found")
	}

	// 检查市场状态
	if market.Status != 1 { // 1-进行中
		return nil, utils.NewError(utils.CodeParamError, "Market is not active")
	}

	// 检查市场是否已结束
	if time.Now().After(*market.EndTime) {
		return nil, utils.NewError(utils.CodeParamError, "Market has ended")
	}

	// 2. 计算订单总价值和手续费
	totalValue := req.Amount * req.Price / 100 // price是cents，需要除以100
	fee := totalValue * 0.02                   // 2%手续费

	// 3. 创建订单
	order := &model.Order{
		MarketID:    req.MarketID,
		UserAddress: userAddress,
		OrderType:   req.OrderType,
		Position:    req.Position,
		Amount:      req.Amount,
		Price:       req.Price,
		TotalValue:  totalValue,
		Fee:         fee,
		Status:      model.OrderStatusPending,
	}

	if err := model.DB.Create(order).Error; err != nil {
		logx.Errorf("Failed to create order: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to create order")
	}

	// 4. TODO: 这里应该调用智能合约创建订单
	// txHash, err := deployOrderToContract(order)
	// if err != nil {
	//     return nil, err
	// }
	// order.TxHash = &txHash
	// model.DB.Save(order)

	// 5. 尝试匹配订单（简化版本，实际应该在后台异步处理）
	go l.matchOrder(order.ID)

	// 6. 缓存订单到Redis
	cacheKey := fmt.Sprintf("order:%d", order.ID)
	orderJSON, err := json.Marshal(order)
	if err != nil {
		logx.Errorf("Failed to marshal order to JSON: %v", err)
	} else {
		if err := model.RDB.Set(l.ctx, cacheKey, orderJSON, 10*time.Minute).Err(); err != nil {
			logx.Errorf("Failed to cache order in Redis: %v", err)
		}
	}

	return &types.CreateOrderResponse{
		OrderID:    order.ID,
		MarketID:   order.MarketID,
		OrderType:  order.OrderType,
		Position:   order.Position,
		Amount:     order.Amount,
		Price:      order.Price,
		TotalValue: order.TotalValue,
		Fee:        order.Fee,
		Status:     order.Status,
		TxHash:     order.TxHash,
		CreatedAt:  order.CreatedAt,
	}, nil
}

// matchOrder 匹配订单（简化版本）
func (l *CreateOrderLogic) matchOrder(orderID uint64) {
	// TODO: 实现订单匹配逻辑
	// 1. 查找相反方向的订单
	// 2. 按价格优先、时间优先原则匹配
	// 3. 创建交易记录
	// 4. 更新订单状态
	// 5. 更新持仓
	// 6. 更新市场统计数据
	logx.Infof("Order matching for order %d (not implemented yet)", orderID)
}
