package trade

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type OrderDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewOrderDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *OrderDetailLogic {
	return &OrderDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *OrderDetailLogic) GetOrderDetail(orderID uint64, userAddress string) (*types.OrderDetailResponse, error) {
	// 查询订单
	var order model.Order
	if err := model.DB.Where("id = ? AND user_address = ?", orderID, userAddress).First(&order).Error; err != nil {
		logx.Errorf("Order not found: %v", err)
		return nil, utils.NewError(utils.CodeNotFound, "Order not found")
	}

	// 查询市场信息
	var market model.Market
	marketQuestion := ""
	if err := model.DB.Where("id = ?", order.MarketID).First(&market).Error; err == nil {
		marketQuestion = market.Question
	}

	// 查询关联的交易记录
	var trades []model.Trade
	model.DB.Where("buy_order_id = ? OR sell_order_id = ?", orderID, orderID).
		Order("created_at DESC").
		Find(&trades)

	// 转换交易记录
	tradeInfos := make([]types.TradeInfo, 0, len(trades))
	for _, trade := range trades {
		isBuyer := trade.BuyOrderID == orderID
		counterparty := trade.SellerAddress
		fee := trade.BuyerFee
		if !isBuyer {
			counterparty = trade.BuyerAddress
			fee = trade.SellerFee
		}

		tradeInfos = append(tradeInfos, types.TradeInfo{
			ID:             trade.ID,
			MarketID:       trade.MarketID,
			MarketQuestion: marketQuestion,
			Position:       trade.Position,
			PositionName:   getPositionName(trade.Position),
			Amount:         trade.Amount,
			Price:          trade.Price,
			TotalValue:     trade.TotalValue,
			Fee:            fee,
			IsBuyer:        isBuyer,
			Counterparty:   counterparty,
			TxHash:         trade.TxHash,
			CreatedAt:      trade.CreatedAt,
		})
	}

	return &types.OrderDetailResponse{
		OrderInfo: types.OrderInfo{
			ID:             order.ID,
			MarketID:       order.MarketID,
			MarketQuestion: marketQuestion,
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
		},
		UpdatedAt:   order.UpdatedAt,
		CancelledAt: order.CancelledAt,
		CompletedAt: order.CompletedAt,
		Trades:      tradeInfos,
	}, nil
}

