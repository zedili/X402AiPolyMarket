package model

import "time"

// Position 持仓模型
type Position struct {
	ID          uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress string `gorm:"type:varchar(42);not null;index:idx_user_address" json:"user_address"`
	MarketID    uint64 `gorm:"type:bigint unsigned;not null;index:idx_market_id" json:"market_id"`
	
	Position  uint8   `gorm:"type:tinyint unsigned;not null" json:"position"` // 0-NO 1-YES
	Shares    float64 `gorm:"type:decimal(20,8);not null;default:0" json:"shares"`
	AvgPrice  float64 `gorm:"type:decimal(10,2);not null;default:0" json:"avg_price"`
	TotalCost float64 `gorm:"type:decimal(20,8);not null;default:0" json:"total_cost"`
	
	CurrentValue   float64 `gorm:"type:decimal(20,8);default:0" json:"current_value"`
	UnrealizedPnL  float64 `gorm:"type:decimal(20,8);default:0" json:"unrealized_pnl"`
	RealizedPnL    float64 `gorm:"type:decimal(20,8);default:0" json:"realized_pnl"`
	
	IsSettled       bool    `gorm:"type:boolean;default:false;index:idx_is_settled" json:"is_settled"`
	SettlementValue float64 `gorm:"type:decimal(20,8);default:0" json:"settlement_value"`
	
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (Position) TableName() string {
	return "positions"
}

