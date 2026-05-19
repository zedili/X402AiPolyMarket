package auth

import (
	"context"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

type NonceLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewNonceLogic(ctx context.Context, svcCtx *svc.ServiceContext) *NonceLogic {
	return &NonceLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *NonceLogic) GetNonce(req *types.NonceRequest) (*types.NonceResponse, error) {

	// 验证钱包地址格式
	if req.ChainType == "EVM" {
		if !utils.IsValidAddress(req.WalletAddress) {
			return nil, utils.NewError(utils.CodeInvalidAddress, "Invalid wallet address")
		}
	} else if req.ChainType == "SOLANA" {
		if !utils.IsValidSolanaAddress(req.WalletAddress) {
			return nil, utils.NewError(utils.CodeInvalidAddress, "Invalid wallet address")
		}
	} else {
		return nil, utils.NewError(utils.CodeInvalidChainType, "Invalid chain type")
	}

	// 标准化地址
	address := req.WalletAddress
	if req.ChainType == "EVM" {
		// 标准化地址
		// EVM 地址以 0x 开头，需要添加 0x 前缀并转为小写
		address = utils.NormalizeAddress(req.WalletAddress)
	}

	// 生成随机数
	nonce, err := utils.GenerateNonce()
	if err != nil {
		logx.Errorf("Failed to generate nonce: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to generate nonce")
	}

	// 生成登录消息
	message := utils.GenerateLoginMessage(nonce)

	// 设置过期时间（5分钟）
	expiresAt := time.Now().Add(5 * time.Minute)

	// 保存到数据库
	authNonce := &model.AuthNonce{
		WalletAddress: address,
		Nonce:         message,
		ExpiresAt:     expiresAt,
		Used:          0,
	}

	if err := model.DB.Create(authNonce).Error; err != nil {
		logx.Errorf("Failed to save nonce, data=%+v, err=%v", authNonce, err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to save nonce")
	}

	// 同时保存到 Redis（可选，用于快速验证）
	cacheKey := "nonce:" + address
	if err := model.RDB.Set(l.ctx, cacheKey, message, 5*time.Minute).Err(); err != nil {
		logx.Errorf("Failed to cache nonce in Redis: %v", err)
	}

	return &types.NonceResponse{
		Nonce:     message,
		ExpiresAt: expiresAt,
	}, nil
}
