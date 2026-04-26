package market

import (
	"context"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type CategoriesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCategoriesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CategoriesLogic {
	return &CategoriesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CategoriesLogic) GetCategories() ([]types.CategoryResponse, error) {
	// 查询所有分类
	var categories []model.MarketCategory
	if err := model.DB.Where("is_active = ?", true).
		Order("sort_order ASC").
		Find(&categories).Error; err != nil {
		logx.Errorf("Failed to query categories: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to query categories")
	}

	// 统计每个分类的市场数量
	result := make([]types.CategoryResponse, 0, len(categories))
	for _, cat := range categories {
		var count int64
		model.DB.Model(&model.Market{}).
			Where("category = ? AND audit_status = ?", cat.Name, model.AuditStatusApproved).
			Count(&count)

		result = append(result, types.CategoryResponse{
			Name:        cat.Name,
			DisplayName: cat.DisplayName,
			Icon:        cat.Icon,
			Description: cat.Description,
			Count:       count,
		})
	}

	return result, nil
}

