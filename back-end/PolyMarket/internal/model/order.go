package model

import "time"

// Order 订单模型
type Order struct {
	ID          uint64  `gorm:"primaryKey;autoIncrement" json:"id"`
	MarketID    uint64  `gorm:"type:bigint unsigned;not null;index:idx_market_id" json:"market_id"`
	UserAddress string  `gorm:"type:varchar(42);not null;index:idx_user_address" json:"user_address"`
	
	OrderType uint8   `gorm:"type:tinyint unsigned;not null" json:"order_type"` // 0-买入 1-卖出
	Position  uint8   `gorm:"type:tinyint unsigned;not null" json:"position"`   // 0-NO 1-YES
	
	Amount     float64 `gorm:"type:decimal(20,8);not null" json:"amount"`
	Price      float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	TotalValue float64 `gorm:"type:decimal(20,8);not null" json:"total_value"`
	Fee        float64 `gorm:"type:decimal(20,8);default:0" json:"fee"`
	
	FilledAmount    float64 `gorm:"type:decimal(20,8);default:0" json:"filled_amount"`
	AvgFilledPrice  float64 `gorm:"type:decimal(10,2);default:0" json:"avg_filled_price"`
	
	Status uint8 `gorm:"type:tinyint unsigned;default:0;index:idx_status" json:"status"` // 0-待成交 1-部分成交 2-完全成交 3-已取消
	
	TxHash      *string `gorm:"type:varchar(66);index:idx_tx_hash" json:"tx_hash,omitempty"`
	BlockNumber *uint64 `gorm:"type:bigint unsigned" json:"block_number,omitempty"`
	
	CancelledAt *time.Time `gorm:"type:timestamp" json:"cancelled_at,omitempty"`
	CompletedAt *time.Time `gorm:"type:timestamp" json:"completed_at,omitempty"`
	CreatedAt   time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (Order) TableName() string {
	return "orders"
}

// 订单类型常量
const (
	OrderTypeBuy  uint8 = 0 // 买入
	OrderTypeSell uint8 = 1 // 卖出
)

// 仓位常量
const (
	PositionNo  uint8 = 0 // NO
	PositionYes uint8 = 1 // YES
)

// 订单状态常量
const (
	OrderStatusPending         uint8 = 0 // 待成交
	OrderStatusPartiallyFilled uint8 = 1 // 部分成交
	OrderStatusFilled          uint8 = 2 // 完全成交
	OrderStatusCancelled       uint8 = 3 // 已取消
)

