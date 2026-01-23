package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// Market 市场模型
type Market struct {
	ID          uint64  `gorm:"primaryKey;autoIncrement" json:"id"`
	Question    string  `gorm:"type:text;not null" json:"question"`
	Description *string `gorm:"type:text" json:"description,omitempty"`
	Category    string  `gorm:"type:varchar(50);index:idx_category;not null" json:"category"`

	CreatorAddress  string  `gorm:"type:varchar(42);index:idx_creator;not null" json:"creator_address"`
	ContractAddress *string `gorm:"type:varchar(42)" json:"contract_address,omitempty"`

	// 价格信息
	YesPrice  float64 `gorm:"type:decimal(10,2);default:50.00" json:"yes_price"`
	NoPrice   float64 `gorm:"type:decimal(10,2);default:50.00" json:"no_price"`
	YesShares float64 `gorm:"type:decimal(20,8);default:0" json:"yes_shares"`
	NoShares  float64 `gorm:"type:decimal(20,8);default:0" json:"no_shares"`

	// 统计信息
	TotalVolume      float64 `gorm:"type:decimal(20,8);default:0" json:"total_volume"`
	TotalLiquidity   float64 `gorm:"type:decimal(20,8);default:0" json:"total_liquidity"`
	ParticipantCount uint    `gorm:"type:int unsigned;default:0" json:"participant_count"`

	// AI预测信息
	AIPrediction *float64 `gorm:"column:ai_prediction;type:decimal(5,2)" json:"ai_prediction,omitempty"`
	Confidence   *float64 `gorm:"type:decimal(5,2)" json:"confidence,omitempty"`
	Suggests     *string  `gorm:"type:varchar(10)" json:"suggests,omitempty"`

	// 时间信息
	StartTime      time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"start_time"`
	EndTime        time.Time  `gorm:"type:timestamp;index:idx_end_time;not null" json:"end_time"`
	SettlementTime *time.Time `gorm:"type:timestamp" json:"settlement_time,omitempty"`

	// 状态
	Status      uint8  `gorm:"type:tinyint unsigned;default:0;index:idx_status" json:"status"`
	Result      *uint8 `gorm:"type:tinyint unsigned" json:"result,omitempty"`
	AuditStatus uint8  `gorm:"type:tinyint unsigned;default:0;index:idx_audit_status" json:"audit_status"`

	// 标签
	IsHot      bool `gorm:"type:boolean;default:false;index:idx_is_hot" json:"is_hot"`
	IsFeatured bool `gorm:"type:boolean;default:false" json:"is_featured"`

	// 其他
	Tags     JSONArray `gorm:"type:json" json:"tags,omitempty"`
	Metadata JSONMap   `gorm:"type:json" json:"metadata,omitempty"`

	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;index:idx_created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (Market) TableName() string {
	return "markets"
}

// MarketCategory 市场分类模型
type MarketCategory struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(50);uniqueIndex:uk_name;not null" json:"name"`
	DisplayName string    `gorm:"type:varchar(100);not null" json:"display_name"`
	Icon        *string   `gorm:"type:varchar(50)" json:"icon,omitempty"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	SortOrder   uint      `gorm:"type:int unsigned;default:0" json:"sort_order"`
	IsActive    bool      `gorm:"type:boolean;default:true" json:"is_active"`
	CreatedAt   time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (MarketCategory) TableName() string {
	return "market_categories"
}

// MarketFavorite 市场收藏模型
type MarketFavorite struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress string    `gorm:"type:varchar(42);index:idx_user;not null" json:"user_address"`
	MarketID    uint64    `gorm:"type:bigint unsigned;index:idx_market;not null" json:"market_id"`
	CreatedAt   time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (MarketFavorite) TableName() string {
	return "market_favorites"
}

// MarketComment 市场评论模型
type MarketComment struct {
	ID          uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	MarketID    uint64     `gorm:"type:bigint unsigned;index:idx_market;not null" json:"market_id"`
	UserAddress string     `gorm:"type:varchar(42);index:idx_user;not null" json:"user_address"`
	Content     string     `gorm:"type:text;not null" json:"content"`
	ParentID    *uint64    `gorm:"type:bigint unsigned;index:idx_parent" json:"parent_id,omitempty"`
	LikeCount   uint       `gorm:"type:int unsigned;default:0" json:"like_count"`
	IsDeleted   bool       `gorm:"type:boolean;default:false" json:"is_deleted"`
	CreatedAt   time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;index:idx_created_at" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (MarketComment) TableName() string {
	return "market_comments"
}

// JSONArray 自定义JSON数组类型
type JSONArray []string

func (j JSONArray) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// JSONMap 自定义JSON对象类型
type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// 市场状态常量
const (
	MarketStatusPending    uint8 = 0 // 待开始
	MarketStatusActive     uint8 = 1 // 进行中
	MarketStatusEnded      uint8 = 2 // 已结束
	MarketStatusSettled    uint8 = 3 // 已结算
	MarketStatusCancelled  uint8 = 4 // 已取消
)

// 审核状态常量
const (
	AuditStatusPending  uint8 = 0 // 待审核
	AuditStatusApproved uint8 = 1 // 已通过
	AuditStatusRejected uint8 = 2 // 已拒绝
)

// 市场结果常量
const (
	MarketResultNo  uint8 = 0 // NO
	MarketResultYes uint8 = 1 // YES
)

