package model

import (
	"time"

	"github.com/0xNetuser/Polymarket-golang/polymarket"
)

// PolymarketL2Account Polymarket L2 账户模型
type PolymarketL2Account struct {
	ID            uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	WalletAddress string `gorm:"type:varchar(50);uniqueIndex:uk_wallet_address;not null" json:"wallet_address"`

	// API 凭证
	APIKey        string `gorm:"type:varchar(255);uniqueIndex:uk_api_key;not null" json:"api_key"`
	APISecret     string `gorm:"type:text;not null" json:"-"`         // 不序列化到 JSON
	APIPassphrase string `gorm:"type:varchar(255);not null" json:"-"` // 不序列化到 JSON

	// 账户信息
	AccountID *string `gorm:"type:varchar(100)" json:"account_id,omitempty"`

	// 私钥（可选）
	PrivateKey *string `gorm:"type:text" json:"-"` // 不序列化到 JSON

	// 状态
	Status    uint8 `gorm:"type:tinyint unsigned;default:0" json:"status"`
	IsDefault bool  `gorm:"type:boolean;default:false" json:"is_default"`

	// 元数据
	LastUsedAt *time.Time `gorm:"type:timestamp" json:"last_used_at,omitempty"`
	ExpiresAt  *time.Time `gorm:"type:timestamp" json:"expires_at,omitempty"`

	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (PolymarketL2Account) TableName() string {
	return "polymarket_l2_accounts"
}

// IsActive 检查账户是否激活
func (a *PolymarketL2Account) IsActive() bool {
	return a.Status == 1
}

// IsExpired 检查账户是否过期
func (a *PolymarketL2Account) IsExpired() bool {
	if a.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*a.ExpiresAt)
}

// GetAPICreds 获取 API 凭证（用于创建 ClobClient）
func (a *PolymarketL2Account) GetAPICreds() *polymarket.ApiCreds {
	return &polymarket.ApiCreds{
		APIKey:        a.APIKey,
		APISecret:     a.APISecret,
		APIPassphrase: a.APIPassphrase,
	}
}
