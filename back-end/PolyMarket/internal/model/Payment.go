package model

import "time"

// Payment x402支付记录模型
type Payment struct {
	ID          uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress string `gorm:"type:varchar(42);not null;index:idx_user_address" json:"user_address"`
	MarketID    uint64 `gorm:"type:bigint unsigned;not null;index:idx_market_id" json:"market_id"`
	CacheKey    string `gorm:"type:varchar(255);not null;index:idx_cache_key" json:"cache_key"` // 缓存键（预测唯一标识）

	// 🔑 关联预测记录
	PredictionLogID *uint64 `gorm:"type:bigint unsigned;index:idx_prediction_log_id" json:"prediction_log_id,omitempty"`

	// 预测信息
	Prediction     uint8   `gorm:"type:tinyint unsigned;not null" json:"prediction"` // 0-NO 1-YES
	PredictionData *string `gorm:"type:text" json:"prediction_data,omitempty"`       // AI预测详情JSON

	// 支付信息
	PaymentAmount float64 `gorm:"type:decimal(20,8);not null" json:"payment_amount"`
	Currency      string  `gorm:"type:varchar(20);default:'USDC'" json:"currency"`     // 支付代币类型
	PaymentType   uint8   `gorm:"type:tinyint unsigned;default:0" json:"payment_type"` // 0-预测购买 1-订阅服务 2-其他

	// 交易信息
	TxHash      *string `gorm:"type:varchar(66);uniqueIndex:uk_tx_hash;index:idx_tx_hash" json:"tx_hash,omitempty"`
	BlockNumber *uint64 `gorm:"type:bigint unsigned" json:"block_number,omitempty"`
	FromAddress *string `gorm:"type:varchar(42)" json:"from_address,omitempty"`
	ToAddress   *string `gorm:"type:varchar(42)" json:"to_address,omitempty"`

	// 支付状态
	Status uint8 `gorm:"type:tinyint unsigned;default:0;index:idx_status" json:"status"` // 0-待支付 1-支付中 2-已支付 3-支付失败 4-已退款

	// 错误信息
	ErrorMessage *string `gorm:"type:text" json:"error_message,omitempty"`

	// 描述和元数据
	Description *string  `gorm:"type:text" json:"description,omitempty"`
	Metadata    *JSONMap `gorm:"type:json" json:"metadata,omitempty"`

	// 时间信息
	PaidAt    *time.Time `gorm:"type:timestamp" json:"paid_at,omitempty"`
	CreatedAt time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;index:idx_created_at" json:"created_at"`
	UpdatedAt time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`

	// 🔑 关联对象（GORM 预加载使用）
	PredictionLog *AIPredictionLog `gorm:"foreignKey:PredictionLogID" json:"prediction_log,omitempty"`
}

// TableName 指定表名
func (Payment) TableName() string {
	return "payments"
}

// 预测方向常量
const (
	PredictionNo  uint8 = 0 // NO
	PredictionYes uint8 = 1 // YES
)

// 支付类型常量
const (
	PaymentTypePrediction   uint8 = 0 // 预测购买
	PaymentTypeSubscription uint8 = 1 // 订阅服务
	PaymentTypeOther        uint8 = 2 // 其他
)

// 支付状态常量
const (
	PaymentStatusPending    uint8 = 0 // 待支付
	PaymentStatusProcessing uint8 = 1 // 支付中
	PaymentStatusPaid       uint8 = 2 // 已支付
	PaymentStatusFailed     uint8 = 3 // 支付失败
	PaymentStatusRefunded   uint8 = 4 // 已退款
)

// IsCompleted 判断支付是否已完成（成功支付）
func (p *Payment) IsCompleted() bool {
	return p.Status == PaymentStatusPaid
}

// IsFailed 判断支付是否失败
func (p *Payment) IsFailed() bool {
	return p.Status == PaymentStatusFailed || p.Status == PaymentStatusRefunded
}

// IsPending 判断支付是否待处理
func (p *Payment) IsPending() bool {
	return p.Status == PaymentStatusPending || p.Status == PaymentStatusProcessing
}

// GetPredictionDirection 获取预测方向字符串
func (p *Payment) GetPredictionDirection() string {
	if p.Prediction == PredictionYes {
		return "YES"
	}
	return "NO"
}

// GetPaymentTypeString 获取支付类型字符串
func (p *Payment) GetPaymentTypeString() string {
	switch p.PaymentType {
	case PaymentTypePrediction:
		return "预测购买"
	case PaymentTypeSubscription:
		return "订阅服务"
	case PaymentTypeOther:
		return "其他"
	default:
		return "未知"
	}
}

// GetStatusString 获取支付状态字符串
func (p *Payment) GetStatusString() string {
	switch p.Status {
	case PaymentStatusPending:
		return "待支付"
	case PaymentStatusProcessing:
		return "支付中"
	case PaymentStatusPaid:
		return "已支付"
	case PaymentStatusFailed:
		return "支付失败"
	case PaymentStatusRefunded:
		return "已退款"
	default:
		return "未知状态"
	}
}

// HasPredictionLog 判断是否关联了预测记录
func (p *Payment) HasPredictionLog() bool {
	return p.PredictionLogID != nil && *p.PredictionLogID > 0
}

// MarkAsPaid 标记为已支付
func (p *Payment) MarkAsPaid(txHash string, blockNumber uint64) {
	now := time.Now().UTC()
	p.Status = PaymentStatusPaid
	p.TxHash = &txHash
	p.BlockNumber = &blockNumber
	p.PaidAt = &now
}

// MarkAsFailed 标记为支付失败
func (p *Payment) MarkAsFailed(errorMessage string) {
	p.Status = PaymentStatusFailed
	p.ErrorMessage = &errorMessage
}

// MarkAsRefunded 标记为已退款
func (p *Payment) MarkAsRefunded(reason string) {
	p.Status = PaymentStatusRefunded
	p.ErrorMessage = &reason
}

// 标记为支付中
func (p *Payment) MarkAsPending() {
	p.Status = PaymentStatusPending
}
