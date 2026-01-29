package market

import (
	"context"
	"strings"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type MarketListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMarketListLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MarketListLogic {
	return &MarketListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MarketListLogic) GetMarketList(req *types.MarketListRequest) (*types.MarketListResponse, error) {
	// 设置默认值
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	if req.PageSize > 100 {
		req.PageSize = 100 // 限制最大页面大小
	}

	// 构建查询
	query := model.DB.Model(&model.Market{})

	// 管理员地址（临时硬编码）
	const adminAddress = "0xf0aC9747345c23B6ba451d9103F8C2785800998D"

	isAdmin := false
	if req.AdminAddress != nil && *req.AdminAddress != "" {
		isAdmin = strings.EqualFold(*req.AdminAddress, adminAddress)
	}

	// 审核状态过滤：
	// - 普通用户：只看已审核通过
	// - 管理员 + pending_only=true：只看待审核
	if isAdmin && req.PendingOnly != nil && *req.PendingOnly {
		query = query.Where("audit_status = ?", model.AuditStatusPending)
	} else {
		query = query.Where("audit_status = ?", model.AuditStatusApproved)
	}

	// 分类筛选
	if req.Category != nil && *req.Category != "" {
		query = query.Where("category = ?", *req.Category)
	}

	// 状态筛选
	if req.Status != nil {
		query = query.Where("status = ?", *req.Status)
	}

	// 热门筛选
	if req.IsHot != nil {
		query = query.Where("is_hot = ?", *req.IsHot)
	}

	// 搜索
	if req.Search != nil && *req.Search != "" {
		searchTerm := "%" + *req.Search + "%"
		query = query.Where("question LIKE ? OR description LIKE ?", searchTerm, searchTerm)
	}

	// 计算总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logx.Errorf("Failed to count markets: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to count markets")
	}

	// 排序
	sortField := "created_at"
	if req.Sort != nil && *req.Sort != "" {
		switch *req.Sort {
		case "volume":
			sortField = "total_volume"
		case "created_at":
			sortField = "created_at"
		case "end_time":
			sortField = "end_time"
		}
	}

	sortOrder := "DESC"
	if req.Order != nil && *req.Order == "asc" {
		sortOrder = "ASC"
	}

	query = query.Order(sortField + " " + sortOrder)

	// 分页
	offset := (req.Page - 1) * req.PageSize
	query = query.Offset(offset).Limit(req.PageSize)

	// 查询数据
	var markets []model.Market
	if err := query.Find(&markets).Error; err != nil {
		logx.Errorf("Failed to query markets: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to query markets")
	}

	// 转换为响应格式
	marketItems := make([]types.MarketListItem, 0, len(markets))
	for _, m := range markets {
		item := types.MarketListItem{
			ID:               m.ID,
			Question:         m.Question,
			Description:      m.Description,
			Category:         m.Category,
			CreatorAddress:   m.CreatorAddress,
			ContractAddress:  m.ContractAddress,
			YesPrice:         m.YesPrice,
			NoPrice:          m.NoPrice,
			TotalVolume:      m.TotalVolume,
			TotalLiquidity:   m.TotalLiquidity,
			ParticipantCount: m.ParticipantCount,
			AIPrediction:     m.AIPrediction,
			Confidence:       m.Confidence,
			Suggests:         m.Suggests,
			StartTime:        m.StartTime,
			EndTime:          m.EndTime,
			Status:           m.Status,
			IsHot:            m.IsHot,
			IsFeatured:       m.IsFeatured,
			CreatedAt:        m.CreatedAt,
		}
		marketItems = append(marketItems, item)
	}

	return &types.MarketListResponse{
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
		Markets:  marketItems,
	}, nil
}

