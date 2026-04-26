package types

import "time"

// CreateMarketRequest 创建市场请求
type CreateMarketRequest struct {
	Question         string   `json:"question" validate:"required"`
	Description      *string  `json:"description,omitempty"`
	Category         string   `json:"category" validate:"required"`
	EndTime          string   `json:"end_time" validate:"required"`
	InitialLiquidity *float64 `json:"initial_liquidity,omitempty"`
	Tags             []string `json:"tags,omitempty"`
}

// CreateMarketResponse 创建市场响应
type CreateMarketResponse struct {
	MarketID        uint64  `json:"market_id"`
	ContractAddress *string `json:"contract_address,omitempty"`
	TxHash          *string `json:"tx_hash,omitempty"`
	Status          string  `json:"status"` // pending, approved
}

// MarketListRequest 市场列表请求
type MarketListRequest struct {
	Page     int     `json:"page" form:"page"`
	PageSize int     `json:"page_size" form:"page_size"`
	Category *string `json:"category,omitempty" form:"category"`
	Status   *uint8  `json:"status,omitempty" form:"status"`
	// 是否只查询待审核市场（仅管理员地址生效）
	PendingOnly *bool   `json:"pending_only,omitempty" form:"pending_only"`
	// 调用方地址，用于简单判断是否为管理员（临时方案）
	AdminAddress *string `json:"admin_address,omitempty" form:"admin_address"`
	Sort     *string `json:"sort,omitempty" form:"sort"`         // volume, created_at, end_time
	Order    *string `json:"order,omitempty" form:"order"`       // asc, desc
	Search   *string `json:"search,omitempty" form:"search"`
	IsHot    *bool   `json:"is_hot,omitempty" form:"is_hot"`
}

// MarketListResponse 市场列表响应
type MarketListResponse struct {
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"page_size"`
	Markets  []MarketListItem `json:"markets"`
}

// MarketListItem 市场列表项
type MarketListItem struct {
	ID          uint64   `json:"id"`
	Question    string   `json:"question"`
	Description *string  `json:"description,omitempty"`
	Category    string   `json:"category"`
	
	CreatorAddress  string  `json:"creator_address"`
	ContractAddress *string `json:"contract_address,omitempty"`
	
	YesPrice  float64 `json:"yes_price"`
	NoPrice   float64 `json:"no_price"`
	
	TotalVolume      float64 `json:"total_volume"`
	TotalLiquidity   float64 `json:"total_liquidity"`
	ParticipantCount uint    `json:"participant_count"`
	
	AIPrediction *float64 `json:"ai_prediction,omitempty"`
	Confidence   *float64 `json:"confidence,omitempty"`
	Suggests     *string  `json:"suggests,omitempty"`
	
	StartTime time.Time  `json:"start_time"`
	EndTime   time.Time  `json:"end_time"`
	Status    uint8      `json:"status"`
	
	IsHot      bool `json:"is_hot"`
	IsFeatured bool `json:"is_featured"`
	
	CreatedAt time.Time `json:"created_at"`
}

// MarketDetailResponse 市场详情响应
type MarketDetailResponse struct {
	ID          uint64   `json:"id"`
	Question    string   `json:"question"`
	Description *string  `json:"description,omitempty"`
	Category    string   `json:"category"`
	
	CreatorAddress  string  `json:"creator_address"`
	ContractAddress *string `json:"contract_address,omitempty"`
	
	YesPrice  float64 `json:"yes_price"`
	NoPrice   float64 `json:"no_price"`
	YesShares float64 `json:"yes_shares"`
	NoShares  float64 `json:"no_shares"`
	
	TotalVolume      float64 `json:"total_volume"`
	TotalLiquidity   float64 `json:"total_liquidity"`
	ParticipantCount uint    `json:"participant_count"`
	
	AIPrediction *float64 `json:"ai_prediction,omitempty"`
	Confidence   *float64 `json:"confidence,omitempty"`
	Suggests     *string  `json:"suggests,omitempty"`
	
	StartTime      time.Time  `json:"start_time"`
	EndTime        time.Time  `json:"end_time"`
	SettlementTime *time.Time `json:"settlement_time,omitempty"`
	
	Status      uint8  `json:"status"`
	Result      *uint8 `json:"result,omitempty"`
	AuditStatus uint8  `json:"audit_status"`
	
	IsHot      bool `json:"is_hot"`
	IsFeatured bool `json:"is_featured"`
	
	Tags     []string               `json:"tags,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
	
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	// 额外信息
	IsFavorited *bool `json:"is_favorited,omitempty"` // 当前用户是否收藏
}

// UpdateMarketRequest 更新市场请求
type UpdateMarketRequest struct {
	Description *string  `json:"description,omitempty"`
	Tags        []string `json:"tags,omitempty"`
}

// CategoryResponse 分类响应
type CategoryResponse struct {
	Name        string  `json:"name"`
	DisplayName string  `json:"display_name"`
	Icon        *string `json:"icon,omitempty"`
	Description *string `json:"description,omitempty"`
	Count       int64   `json:"count"` // 该分类下的市场数量
}

// HotMarketRequest 热门市场请求
type HotMarketRequest struct {
	Limit int `json:"limit" form:"limit"`
}

// MarketStatsResponse 市场统计响应
type MarketStatsResponse struct {
	TotalMarkets     int64   `json:"total_markets"`
	ActiveMarkets    int64   `json:"active_markets"`
	TotalVolume      float64 `json:"total_volume"`
	TotalParticipants int64  `json:"total_participants"`
}

// FavoriteMarketRequest 收藏市场请求
type FavoriteMarketRequest struct {
	MarketID uint64 `json:"market_id" validate:"required"`
}

// UnfavoriteMarketRequest 取消收藏市场请求
type UnfavoriteMarketRequest struct {
	MarketID uint64 `json:"market_id" validate:"required"`
}

// MarketPriceUpdate 市场价格更新（用于WebSocket推送）
type MarketPriceUpdate struct {
	MarketID   uint64    `json:"market_id"`
	YesPrice   float64   `json:"yes_price"`
	NoPrice    float64   `json:"no_price"`
	Volume24h  float64   `json:"volume_24h"`
	UpdatedAt  time.Time `json:"updated_at"`
}

