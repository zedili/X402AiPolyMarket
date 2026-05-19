package types

import "time"

// NonceRequest 获取Nonce请求
type NonceRequest struct {
	WalletAddress string `json:"wallet_address" validate:"required"`
	ChainType     string `json:"chain_type" validate:"required"`
}

// NonceResponse 获取Nonce响应
type NonceResponse struct {
	Nonce     string    `json:"nonce"`
	ExpiresAt time.Time `json:"expires_at"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	WalletAddress string `json:"wallet_address" validate:"required"`
	Signature     string `json:"signature" validate:"required"`
	Nonce         string `json:"nonce" validate:"required"`
	ChainType     string `json:"chain_type" validate:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresIn    int64     `json:"expires_in"`
	User         *UserInfo `json:"user"`
}

// RefreshTokenRequest 刷新Token请求
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// RefreshTokenResponse 刷新Token响应
type RefreshTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
}

// UserInfo 用户基本信息
type UserInfo struct {
	ID            uint64     `json:"id"`
	WalletAddress string     `json:"wallet_address"`
	Username      *string    `json:"username,omitempty"`
	AvatarURL     *string    `json:"avatar_url,omitempty"`
	Email         *string    `json:"email,omitempty"`
	Bio           *string    `json:"bio,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	LastLoginAt   *time.Time `json:"last_login_at,omitempty"`
}

// UserProfileResponse 用户资料响应
type UserProfileResponse struct {
	ID            uint64     `json:"id"`
	WalletAddress string     `json:"wallet_address"`
	Username      *string    `json:"username,omitempty"`
	AvatarURL     *string    `json:"avatar_url,omitempty"`
	Email         *string    `json:"email,omitempty"`
	Bio           *string    `json:"bio,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	LastLoginAt   *time.Time `json:"last_login_at,omitempty"`
	Stats         *UserStats `json:"stats,omitempty"`
}

// UserStats 用户统计
type UserStats struct {
	TotalTrades uint    `json:"total_trades"`
	TotalVolume float64 `json:"total_volume"`
	TotalProfit float64 `json:"total_profit"`
	WinCount    uint    `json:"win_count"`
	LoseCount   uint    `json:"lose_count"`
	WinRate     float64 `json:"win_rate"`
}

// UpdateProfileRequest 更新用户资料请求
type UpdateProfileRequest struct {
	Username  *string `json:"username,omitempty"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	Email     *string `json:"email,omitempty"`
	Bio       *string `json:"bio,omitempty"`
}

// PublicUserResponse 公开用户信息响应
type PublicUserResponse struct {
	WalletAddress string     `json:"wallet_address"`
	Username      *string    `json:"username,omitempty"`
	AvatarURL     *string    `json:"avatar_url,omitempty"`
	Bio           *string    `json:"bio,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	Stats         *UserStats `json:"stats,omitempty"`
}
