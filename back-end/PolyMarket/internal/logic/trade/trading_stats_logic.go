package trade

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type TradingStatsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTradingStatsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TradingStatsLogic {
	return &TradingStatsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TradingStatsLogic) GetTradingStats(userAddress string) (*types.TradingStatsResponse, error) {
	// 统计订单数量
	var totalOrders, activeOrders, completedOrders int64
	model.DB.Model(&model.Order{}).Where("user_address = ?", userAddress).Count(&totalOrders)
	model.DB.Model(&model.Order{}).Where("user_address = ? AND status IN ?", userAddress, []uint8{0, 1}).Count(&activeOrders)
	model.DB.Model(&model.Order{}).Where("user_address = ? AND status = ?", userAddress, 2).Count(&completedOrders)

	// 统计交易数量和交易量
	var totalTrades int64
	var totalVolume, totalFees float64

	model.DB.Model(&model.Trade{}).
		Where("buyer_address = ? OR seller_address = ?", userAddress, userAddress).
		Count(&totalTrades)

	// 计算总交易量（买方）
	var buyVolume, buyFees float64
	model.DB.Model(&model.Trade{}).
		Where("buyer_address = ?", userAddress).
		Select("COALESCE(SUM(total_value), 0) as volume, COALESCE(SUM(buyer_fee), 0) as fees").
		Row().Scan(&buyVolume, &buyFees)

	// 计算总交易量（卖方）
	var sellVolume, sellFees float64
	model.DB.Model(&model.Trade{}).
		Where("seller_address = ?", userAddress).
		Select("COALESCE(SUM(total_value), 0) as volume, COALESCE(SUM(seller_fee), 0) as fees").
		Row().Scan(&sellVolume, &sellFees)

	totalVolume = buyVolume + sellVolume
	totalFees = buyFees + sellFees

	// 统计持仓
	var activePositions int64
	model.DB.Model(&model.Position{}).
		Where("user_address = ? AND is_settled = ? AND shares > 0", userAddress, false).
		Count(&activePositions)

	// 计算总盈亏
	var totalUnrealizedPnL, totalRealizedPnL float64
	model.DB.Model(&model.Position{}).
		Where("user_address = ?", userAddress).
		Select("COALESCE(SUM(unrealized_pnl), 0) as unrealized, COALESCE(SUM(realized_pnl), 0) as realized").
		Row().Scan(&totalUnrealizedPnL, &totalRealizedPnL)

	totalProfit := totalUnrealizedPnL + totalRealizedPnL

	// 计算胜率（简化版本：已结算且盈利的持仓数 / 已结算的持仓数）
	var settledPositions, profitablePositions int64
	model.DB.Model(&model.Position{}).
		Where("user_address = ? AND is_settled = ?", userAddress, true).
		Count(&settledPositions)
	model.DB.Model(&model.Position{}).
		Where("user_address = ? AND is_settled = ? AND realized_pnl > 0", userAddress, true).
		Count(&profitablePositions)

	winRate := 0.0
	if settledPositions > 0 {
		winRate = float64(profitablePositions) / float64(settledPositions) * 100
	}

	return &types.TradingStatsResponse{
		TotalOrders:     totalOrders,
		ActiveOrders:    activeOrders,
		CompletedOrders: completedOrders,
		TotalTrades:     totalTrades,
		TotalVolume:     totalVolume,
		TotalFees:       totalFees,
		ActivePositions: activePositions,
		TotalProfit:     totalProfit,
		WinRate:         winRate,
	}, nil
}
