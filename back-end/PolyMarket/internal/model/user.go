package model

import "time"

// User 用户模型
type User struct {
	ID            uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	WalletAddress string     `gorm:"type:varchar(42);uniqueIndex:uk_wallet_address;not null" json:"wallet_address"`
	Username      *string    `gorm:"type:varchar(50);index:idx_username" json:"username,omitempty"`
	AvatarURL     *string    `gorm:"type:varchar(255)" json:"avatar_url,omitempty"`
	Email         *string    `gorm:"type:varchar(100)" json:"email,omitempty"`
	Bio           *string    `gorm:"type:text" json:"bio,omitempty"`
	TotalTrades   uint       `gorm:"type:int unsigned;default:0" json:"total_trades"`
	TotalVolume   float64    `gorm:"type:decimal(20,8);default:0" json:"total_volume"`
	TotalProfit   float64    `gorm:"type:decimal(20,8);default:0" json:"total_profit"`
	WinCount      uint       `gorm:"type:int unsigned;default:0" json:"win_count"`
	LoseCount     uint       `gorm:"type:int unsigned;default:0" json:"lose_count"`
	Status        uint8      `gorm:"type:tinyint unsigned;default:0" json:"status"`
	LastLoginAt   *time.Time `gorm:"type:timestamp" json:"last_login_at,omitempty"`
	CreatedAt     time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

// UserStats 用户统计数据
type UserStats struct {
	TotalTrades uint    `json:"total_trades"`
	TotalVolume float64 `json:"total_volume"`
	TotalProfit float64 `json:"total_profit"`
	WinCount    uint    `json:"win_count"`
	LoseCount   uint    `json:"lose_count"`
	WinRate     float64 `json:"win_rate"`
}

// GetStats 获取用户统计数据
func (u *User) GetStats() UserStats {
	winRate := 0.0
	if u.TotalTrades > 0 {
		winRate = float64(u.WinCount) / float64(u.TotalTrades) * 100
	}

	return UserStats{
		TotalTrades: u.TotalTrades,
		TotalVolume: u.TotalVolume,
		TotalProfit: u.TotalProfit,
		WinCount:    u.WinCount,
		LoseCount:   u.LoseCount,
		WinRate:     winRate,
	}
}

// AuthNonce 认证随机数模型
type AuthNonce struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	WalletAddress string    `gorm:"type:varchar(50);index:idx_wallet_address;not null" json:"wallet_address"`
	Nonce         string    `gorm:"type:varchar(255);uniqueIndex:uk_nonce;not null" json:"nonce"`
	ExpiresAt     time.Time `gorm:"type:timestamp;index:idx_expires_at;not null" json:"expires_at"`
	Used          uint8     `gorm:"type:tinyint unsigned;default:0" json:"used"`
	CreatedAt     time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (AuthNonce) TableName() string {
	return "auth_nonces"
}

// RefreshToken 刷新令牌模型
type RefreshToken struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint64    `gorm:"type:bigint unsigned;index:idx_user_id;not null" json:"user_id"`
	Token     string    `gorm:"type:varchar(255);uniqueIndex:uk_token;not null" json:"token"`
	ExpiresAt time.Time `gorm:"type:timestamp;index:idx_expires_at;not null" json:"expires_at"`
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
