package market

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

type CreateMarketLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateMarketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateMarketLogic {
	return &CreateMarketLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateMarketLogic) CreateMarket(req *types.CreateMarketRequest, userAddress string) (*types.CreateMarketResponse, error) {
	// 验证分类
	validCategories := []string{"CRYPTO", "TECH", "STOCKS", "POLITICS", "SPORTS", "SCIENCE"}
	isValidCategory := false
	for _, cat := range validCategories {
		if req.Category == cat {
			isValidCategory = true
			break
		}
	}
	if !isValidCategory {
		return nil, utils.NewError(utils.CodeParamError, "Invalid category")
	}

	// 解析结束时间
	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return nil, utils.NewError(utils.CodeParamError, "Invalid end_time format, use RFC3339")
	}

	// 验证结束时间必须在未来
	if endTime.Before(time.Now()) {
		return nil, utils.NewError(utils.CodeParamError, "End time must be in the future")
	}

	// 验证结束时间不能太远（例如不超过2年）
	maxEndTime := time.Now().AddDate(2, 0, 0)
	if endTime.After(maxEndTime) {
		return nil, utils.NewError(utils.CodeParamError, "End time cannot be more than 2 years in the future")
	}

	// 标准化用户地址
	creatorAddress := utils.NormalizeAddress(userAddress)

	// 创建市场
	market := &model.Market{
		Question:       req.Question,
		Description:    req.Description,
		Category:       req.Category,
		CreatorAddress: creatorAddress,
		YesPrice:       50.00, // 初始价格
		NoPrice:        50.00,
		EndTime:        &endTime,
		Status:         model.MarketStatusPending, // 待开始
		AuditStatus:    model.AuditStatusPending,  // 待审核
		Tags:           req.Tags,
	}

	// 如果提供了初始流动性，设置流动性
	if req.InitialLiquidity != nil && *req.InitialLiquidity > 0 {
		market.TotalLiquidity = *req.InitialLiquidity
	}

	// 保存到数据库
	if err := model.DB.Create(market).Error; err != nil {
		logx.Errorf("Failed to create market: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to create market")
	}

	// TODO: 这里可以添加智能合约部署逻辑
	// contractAddress, txHash := deployMarketContract(market)

	// 缓存到 Redis（可选）
	cacheKey := fmt.Sprintf("market:%d", market.ID)
	marketJSON, err := json.Marshal(market)
	if err != nil {
		logx.Errorf("Failed to marshal market to JSON: %v", err)
	} else {
		if err := model.RDB.Set(l.ctx, cacheKey, marketJSON, 10*time.Minute).Err(); err != nil {
			logx.Errorf("Failed to cache market in Redis: %v", err)
		}
	}

	return &types.CreateMarketResponse{
		MarketID: market.ID,
		Status:   "pending", // 待审核
	}, nil
}
