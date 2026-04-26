package service

import (
	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/polymarket"
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm/clause"
)

// MarketSyncService 市场数据同步服务
type MarketSyncService struct {
	gammaClient *polymarket.GammaClient
}

// NewMarketSyncService 创建市场数据同步服务
func NewMarketSyncService() *MarketSyncService {
	return &MarketSyncService{
		gammaClient: polymarket.NewGammaClient(),
	}
}

// SyncMarkets 同步市场数据到现有的 markets 表
func (s *MarketSyncService) SyncMarkets(ctx context.Context) error {
	logx.Info("开始同步 Polymarket 市场数据...")
	startTime := time.Now()

	markets, err := s.gammaClient.GetMarkets(nil)
	if err != nil {
		return fmt.Errorf("获取市场数据失败: %w", err)
	}

	logx.Infof("获取到 %d 个市场数据，耗时: %v", len(markets), time.Since(startTime))

	successCount := 0
	failedCount := 0

	for _, pmMarket := range markets {
		existingMarket, err := s.mapToExistingMarket(pmMarket)
		if err != nil {
			logx.Errorf("映射市场数据失败 [ID=%s]: %v", pmMarket.ID, err)
			failedCount++
			continue
		}

		err = model.DB.WithContext(ctx).Clauses(
			clause.OnConflict{
				Columns: []clause.Column{{Name: "market_id"}}, // 👈 冲突判断字段
				DoUpdates: clause.AssignmentColumns([]string{ // 👈 冲突时更新的字段
					"question",
					"description",
					"category",
					"creator_address",
					"yes_price",
					"no_price",
					"yes_shares",
					"no_shares",
					"total_volume",
					"total_liquidity",
					"start_time",
					"end_time",
					"status",
					"is_hot",
					"is_featured",
					"tags",
					"metadata",
					"updated_at",
				}),
			},
		).Create(&existingMarket).Error

		if err != nil {
			logx.Errorf("保存市场数据失败 [ID=%s]: %v", pmMarket.ID, err)
			failedCount++
			continue
		}

		successCount++
	}

	totalDuration := time.Since(startTime)
	logx.Infof("市场数据同步完成 - 成功: %d, 失败: %d, 总耗时: %v",
		successCount, failedCount, totalDuration)

	if failedCount > 0 {
		return fmt.Errorf("部分市场数据同步失败: %d/%d", failedCount, successCount+failedCount)
	}

	return nil
}

// mapToExistingMarket 将 Polymarket API 数据映射到现有的 Market 模型
func (s *MarketSyncService) mapToExistingMarket(pmMarket polymarket.Market) (*model.Market, error) {
	now := time.Now()

	// 确定分类（根据问题内容简单分类）
	category := s.categorizeMarket(pmMarket.Question)

	// 计算价格（从 outcomePrices 提取）
	var yesPrice, noPrice float64
	if len(pmMarket.OutcomePrices) >= 2 {
		yesPrice = pmMarket.OutcomePrices[0] * 100 // 转换为百分比
		noPrice = pmMarket.OutcomePrices[1] * 100
	} else {
		yesPrice = 50.0
		noPrice = 50.0
	}

	// 计算份额（从流动性分配）
	var yesShares, noShares float64
	if pmMarket.LiquidityNum > 0 {
		yesShares = pmMarket.LiquidityNum * pmMarket.OutcomePrices[0]
		noShares = pmMarket.LiquidityNum * pmMarket.OutcomePrices[1]
	}

	// 解析标签
	tags := s.extractTags(pmMarket)

	// 构建元数据
	metadata := model.JSONMap{
		"condition_id":              pmMarket.ConditionID,
		"slug":                      pmMarket.Slug,
		"resolution_source":         pmMarket.ResolutionSource,
		"group_item_title":          pmMarket.GroupItemTitle,
		"group_item_threshold":      pmMarket.GroupItemThreshold,
		"question_id":               pmMarket.QuestionID,
		"enable_order_book":         pmMarket.EnableOrderBook,
		"order_price_min_tick_size": pmMarket.OrderPriceMinTickSize,
		"order_min_size":            pmMarket.OrderMinSize,
		"neg_risk":                  pmMarket.NegRisk,
		"restricted":                pmMarket.Restricted,
		"sync_time":                 now.Format(time.RFC3339),
		"original_id":               pmMarket.ID,
	}

	// 添加交易量信息
	if pmMarket.VolumeNum > 0 {
		metadata["volume_num"] = pmMarket.VolumeNum
		metadata["volume_24hr"] = pmMarket.Volume24hr
		metadata["volume_1wk"] = pmMarket.Volume1wk
		metadata["volume_1mo"] = pmMarket.Volume1mo
		metadata["volume_1yr"] = pmMarket.Volume1yr
	}

	// 添加价格变化信息
	if pmMarket.OneDayPriceChange != nil {
		metadata["one_day_price_change"] = *pmMarket.OneDayPriceChange
	}
	if pmMarket.OneHourPriceChange != nil {
		metadata["one_hour_price_change"] = *pmMarket.OneHourPriceChange
	}
	if pmMarket.OneWeekPriceChange != nil {
		metadata["one_week_price_change"] = *pmMarket.OneWeekPriceChange
	}
	if pmMarket.OneMonthPriceChange != nil {
		metadata["one_month_price_change"] = *pmMarket.OneMonthPriceChange
	}

	// 添加最佳买卖价
	if pmMarket.BestBid != nil {
		metadata["best_bid"] = *pmMarket.BestBid
	}
	if pmMarket.BestAsk != nil {
		metadata["best_ask"] = *pmMarket.BestAsk
	}
	if pmMarket.LastTradePrice != nil {
		metadata["last_trade_price"] = *pmMarket.LastTradePrice
	}

	// 确定市场状态
	status := s.determineStatus(pmMarket)

	// 创建或更新市场记录
	market := &model.Market{
		MarketId:        pmMarket.ID,
		Question:        pmMarket.Question,
		Description:     &pmMarket.Description,
		Category:        category,
		CreatorAddress:  pmMarket.SubmittedBy,
		ContractAddress: &pmMarket.MarketMakerAddress,

		// 价格信息
		YesPrice:  yesPrice,
		NoPrice:   noPrice,
		YesShares: yesShares,
		NoShares:  noShares,

		// 统计信息
		TotalVolume:    pmMarket.VolumeNum,
		TotalLiquidity: pmMarket.LiquidityNum,

		// 时间信息
		StartTime: pmMarket.StartDate,
		EndTime:   pmMarket.EndDate,

		// 状态
		Status: status,

		// 标签
		IsHot:      pmMarket.Featured,
		IsFeatured: pmMarket.Featured,

		// 其他
		Tags:     tags,
		Metadata: metadata,
	}

	// 如果有关键的合约地址，使用它作为唯一标识
	if pmMarket.MarketMakerAddress != "" {
		market.ContractAddress = &pmMarket.MarketMakerAddress
	}

	//else {
	//	// 如果没有合约地址，使用 condition_id 作为替代
	//	contractAddr := "poly_" + pmMarket.ConditionID
	//	market.ContractAddress = &contractAddr
	//}

	return market, nil
}

// categorizeMarket 根据问题内容自动分类
func (s *MarketSyncService) categorizeMarket(question string) string {
	question = strings.ToLower(question)

	// 政治类
	if strings.Contains(question, "trump") ||
		strings.Contains(question, "president") ||
		strings.Contains(question, "election") ||
		strings.Contains(question, "political") {
		return "politics"
	}

	// 体育类
	if strings.Contains(question, "win") ||
		strings.Contains(question, "championship") ||
		strings.Contains(question, "nba") ||
		strings.Contains(question, "nfl") ||
		strings.Contains(question, "nhl") {
		return "sports"
	}

	// 加密货币类
	if strings.Contains(question, "bitcoin") ||
		strings.Contains(question, "btc") ||
		strings.Contains(question, "ethereum") ||
		strings.Contains(question, "crypto") {
		return "crypto"
	}

	// 娱乐类
	if strings.Contains(question, "album") ||
		strings.Contains(question, "movie") ||
		strings.Contains(question, "gta") ||
		strings.Contains(question, "game") {
		return "entertainment"
	}

	// 科技类
	if strings.Contains(question, "ai") ||
		strings.Contains(question, "tech") ||
		strings.Contains(question, "apple") ||
		strings.Contains(question, "google") {
		return "technology"
	}

	// 默认分类
	return "general"
}

// extractTags 从 Polymarket 数据中提取标签
func (s *MarketSyncService) extractTags(pmMarket polymarket.Market) model.JSONArray {
	var tags []string

	// 根据特征添加标签
	if pmMarket.Featured {
		tags = append(tags, "featured")
	}

	if pmMarket.New {
		tags = append(tags, "new")
	}

	if pmMarket.EnableOrderBook {
		tags = append(tags, "orderbook")
	}

	if pmMarket.NegRisk {
		tags = append(tags, "negrisk")
	}

	// 添加分类标签
	category := s.categorizeMarket(pmMarket.Question)
	tags = append(tags, category)

	// 如果有分组，添加分组标签
	if pmMarket.GroupItemTitle != "" {
		tags = append(tags, strings.ToLower(strings.ReplaceAll(pmMarket.GroupItemTitle, " ", "_")))
	}

	if len(tags) == 0 {
		return nil
	}

	return tags
}

// determineStatus 确定市场状态
func (s *MarketSyncService) determineStatus(pmMarket polymarket.Market) uint8 {
	now := time.Now()

	// 已结束的市场
	if pmMarket.Closed || pmMarket.Archived {
		return model.MarketStatusEnded
	}

	// 未来的市场
	if pmMarket.StartDate.After(now) {
		return model.MarketStatusPending
	}

	// 进行中的市场
	if pmMarket.Active && !pmMarket.Closed {
		return model.MarketStatusActive
	}

	// 默认状态
	return model.MarketStatusPending
}

// GetMarketStats 获取同步统计信息
func (s *MarketSyncService) GetMarketStats(ctx context.Context) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 总数
	var totalCount int64
	model.DB.WithContext(ctx).Model(&model.Market{}).Count(&totalCount)
	stats["total_markets"] = totalCount

	// 按分类统计
	var categoryStats []struct {
		Category string
		Count    int64
	}
	model.DB.WithContext(ctx).Model(&model.Market{}).
		Select("category, COUNT(*) as count").
		Group("category").
		Scan(&categoryStats)
	stats["category_stats"] = categoryStats

	// 按状态统计
	var statusStats []struct {
		Status uint8
		Count  int64
	}
	model.DB.WithContext(ctx).Model(&model.Market{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusStats)
	stats["status_stats"] = statusStats

	return stats, nil
}
