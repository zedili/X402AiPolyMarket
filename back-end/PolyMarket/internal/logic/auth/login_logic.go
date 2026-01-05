package auth

import (
	"context"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

type LoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginRequest) (*types.LoginResponse, error) {
	// 验证钱包地址格式
	if !utils.IsValidAddress(req.WalletAddress) {
		return nil, utils.NewError(utils.CodeInvalidAddress, "Invalid wallet address")
	}

	// 标准化地址
	address := utils.NormalizeAddress(req.WalletAddress)

	// 验证 Nonce 是否存在且未过期
	var authNonce model.AuthNonce
	err := model.DB.Where("wallet_address = ? AND nonce = ? AND used = 0 AND expires_at > ?",
		address, req.Nonce, time.Now()).First(&authNonce).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, utils.NewError(utils.CodeInvalidSign, "Invalid or expired nonce")
		}
		logx.Errorf("Failed to query nonce: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to verify nonce")
	}

	// 验证签名
	valid, err := utils.VerifySignature(req.Nonce, req.Signature, address)
	if err != nil {
		logx.Errorf("Failed to verify signature: %v", err)
		return nil, utils.NewError(utils.CodeInvalidSign, "Failed to verify signature")
	}

	if !valid {
		return nil, utils.NewError(utils.CodeInvalidSign, "Invalid signature")
	}

	// 标记 Nonce 为已使用
	if err := model.DB.Model(&authNonce).Update("used", 1).Error; err != nil {
		logx.Errorf("Failed to mark nonce as used: %v", err)
	}

	// 查找或创建用户
	var user model.User
	err = model.DB.Where("wallet_address = ?", address).First(&user).Error

	if err == gorm.ErrRecordNotFound {
		// 创建新用户
		user = model.User{
			WalletAddress: address,
			Status:        0,
		}
		if err := model.DB.Create(&user).Error; err != nil {
			logx.Errorf("Failed to create user: %v", err)
			return nil, utils.NewError(utils.CodeServerError, "Failed to create user")
		}
	} else if err != nil {
		logx.Errorf("Failed to query user: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to query user")
	}

	// 更新最后登录时间
	now := time.Now()
	user.LastLoginAt = &now
	if err := model.DB.Save(&user).Error; err != nil {
		logx.Errorf("Failed to update last login time: %v", err)
	}

	// 生成 Access Token
	accessToken, err := utils.GenerateToken(
		user.ID,
		user.WalletAddress,
		l.svcCtx.Config.Auth.AccessSecret,
		l.svcCtx.Config.Auth.AccessExpire,
	)
	if err != nil {
		logx.Errorf("Failed to generate access token: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to generate token")
	}

	// 生成 Refresh Token
	refreshToken, err := utils.GenerateRefreshToken(
		user.ID,
		l.svcCtx.Config.Auth.RefreshSecret,
		l.svcCtx.Config.Auth.RefreshExpire,
	)
	if err != nil {
		logx.Errorf("Failed to generate refresh token: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to generate refresh token")
	}

	// 保存 Refresh Token 到数据库
	refreshTokenModel := &model.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: time.Now().Add(time.Duration(l.svcCtx.Config.Auth.RefreshExpire) * time.Second),
	}
	if err := model.DB.Create(refreshTokenModel).Error; err != nil {
		logx.Errorf("Failed to save refresh token: %v", err)
	}

	// 构造响应
	userInfo := &types.UserInfo{
		ID:            user.ID,
		WalletAddress: user.WalletAddress,
		Username:      user.Username,
		AvatarURL:     user.AvatarURL,
		CreatedAt:     user.CreatedAt,
		LastLoginAt:   user.LastLoginAt,
	}

	return &types.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    l.svcCtx.Config.Auth.AccessExpire,
		User:         userInfo,
	}, nil
}
