package model

import "time"

// Trade 交易记录模型
type Trade struct {
	ID           uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	MarketID     uint64 `gorm:"type:bigint unsigned;not null;index:idx_market_id" json:"market_id"`
	BuyOrderID   uint64 `gorm:"type:bigint unsigned;not null" json:"buy_order_id"`
	SellOrderID  uint64 `gorm:"type:bigint unsigned;not null" json:"sell_order_id"`
	
	BuyerAddress  string `gorm:"type:varchar(42);not null;index:idx_buyer" json:"buyer_address"`
	SellerAddress string `gorm:"type:varchar(42);not null;index:idx_seller" json:"seller_address"`
	
	Position   uint8   `gorm:"type:tinyint unsigned;not null" json:"position"` // 0-NO 1-YES
	Amount     float64 `gorm:"type:decimal(20,8);not null" json:"amount"`
	Price      float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	TotalValue float64 `gorm:"type:decimal(20,8);not null" json:"total_value"`
	
	BuyerFee  float64 `gorm:"type:decimal(20,8);default:0" json:"buyer_fee"`
	SellerFee float64 `gorm:"type:decimal(20,8);default:0" json:"seller_fee"`
	
	TxHash      *string `gorm:"type:varchar(66);index:idx_tx_hash" json:"tx_hash,omitempty"`
	BlockNumber *uint64 `gorm:"type:bigint unsigned" json:"block_number,omitempty"`
	
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;index:idx_created_at" json:"created_at"`
}

// TableName 指定表名
func (Trade) TableName() string {
	return "trades"
}

