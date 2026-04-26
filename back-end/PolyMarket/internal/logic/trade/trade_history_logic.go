package trade

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type TradeHistoryLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTradeHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TradeHistoryLogic {
	return &TradeHistoryLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TradeHistoryLogic) GetTradeHistory(req *types.TradeHistoryRequest, userAddress string) (*types.TradeHistoryResponse, error) {
	// 设置默认分页参数
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 || req.PageSize > 100 {
		req.PageSize = 20
	}

	// 构建查询
	query := model.DB.Model(&model.Trade{}).
		Where("buyer_address = ? OR seller_address = ?", userAddress, userAddress)

	// 筛选条件
	if req.MarketID != nil {
		query = query.Where("market_id = ?", *req.MarketID)
	}
	if req.StartTime != nil {
		query = query.Where("created_at >= ?", *req.StartTime)
	}
	if req.EndTime != nil {
		query = query.Where("created_at <= ?", *req.EndTime)
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logx.Errorf("Failed to count trades: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to get trade count")
	}

	// 分页查询
	var trades []model.Trade
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&trades).Error; err != nil {
		logx.Errorf("Failed to query trades: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to get trades")
	}

	// 获取市场信息
	marketIDs := make([]uint64, 0, len(trades))
	for _, trade := range trades {
		marketIDs = append(marketIDs, trade.MarketID)
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
	tradeInfos := make([]types.TradeInfo, 0, len(trades))
	for _, trade := range trades {
		isBuyer := trade.BuyerAddress == userAddress
		counterparty := trade.SellerAddress
		fee := trade.BuyerFee
		if !isBuyer {
			counterparty = trade.BuyerAddress
			fee = trade.SellerFee
		}

		tradeInfo := types.TradeInfo{
			ID:           trade.ID,
			MarketID:     trade.MarketID,
			Position:     trade.Position,
			PositionName: getPositionName(trade.Position),
			Amount:       trade.Amount,
			Price:        trade.Price,
			TotalValue:   trade.TotalValue,
			Fee:          fee,
			IsBuyer:      isBuyer,
			Counterparty: counterparty,
			TxHash:       trade.TxHash,
			CreatedAt:    trade.CreatedAt,
		}

		// 添加市场问题
		if market, ok := marketMap[trade.MarketID]; ok {
			tradeInfo.MarketQuestion = market.Question
		}

		tradeInfos = append(tradeInfos, tradeInfo)
	}

	return &types.TradeHistoryResponse{
		Total:  total,
		Trades: tradeInfos,
	}, nil
}

