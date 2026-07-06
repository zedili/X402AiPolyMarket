package plmk

import (
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/types"
	"context"
	_ "errors"
	"log"
	"strings"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/utils"

	"github.com/zedili/Polymarket-golang/polymarket"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

type PolymarketL2Logic struct {
	logx.Logger
	ctx            context.Context
	svcCtx         *svc.ServiceContext
	plmkClobClient *polymarket.ClobClient
}

func NewPolymarketL2Logic(ctx context.Context, svcCtx *svc.ServiceContext) *PolymarketL2Logic {
	clobHost := svcCtx.Config.PloymarketConfig.ClobHost
	chainId := svcCtx.Config.PloymarketConfig.ChainId
	address, b := middleware.GetWalletAddress(ctx)
	var client *polymarket.ClobClient
	var err error
	// 登录
	if b {
		client, err = polymarket.NewClobClient(clobHost, chainId, "", address, nil, nil, "")
	}

	if err != nil {
		log.Fatalf("new client: %v", err)
	}

	return &PolymarketL2Logic{
		Logger:         logx.WithContext(ctx),
		ctx:            ctx,
		svcCtx:         svcCtx,
		plmkClobClient: client,
	}
}

// CreateApiKeyRequest 创建 API Key 请求结构
//type CreateCheckApiKeyRequest struct {
//	Address   string `json:"address"`
//	Timestamp string `json:"timestamp"`
//	Nonce     int    `json:"nonce"`
//	Signature string `json:"signature"`
//}

// CreateApiKey 创建 Polymarket L2 API Key
func (l *PolymarketL2Logic) CreateApiKey(req *types.PolymarketCreds, walletAddress string) (*polymarket.ApiCreds, error) {
	// 验证请求参数
	if req.POLY_ADDRESS == "" || req.POLY_TIMESTAMP == "" || req.POLY_SIGNATURE == "" {
		return nil, utils.NewError(utils.CodeParamError, "Missing required parameters")
	}

	if !strings.EqualFold(walletAddress, req.POLY_ADDRESS) {
		return nil, utils.NewError(utils.CodeParamError, "Invalid wallet address")
	}

	// 调用 Polymarket API 创建 API Key
	apiCreds, err := l.plmkClobClient.CreateAPIKeyWithHeaders(req.ToHeaders())
	l.Infof("API Key: %s", apiCreds)

	builderApiKey, err := l.plmkClobClient.CreateBuilderAPIKeyWithAddress()
	l.Infof("Builder API Key: %s", builderApiKey)

	if err != nil {
		l.Errorf("Failed to call Polymarket API: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to create API key")
	}

	// 验证返回的凭证
	if apiCreds.APIKey == "" || apiCreds.APISecret == "" || apiCreds.APIPassphrase == "" {
		return nil, utils.NewError(utils.CodeServerError, "Incomplete API credentials received")
	}

	// 保存到数据库
	l2Account := &model.PolymarketL2Account{
		WalletAddress: walletAddress,
		APIKey:        apiCreds.APIKey,
		APISecret:     apiCreds.APISecret,
		APIPassphrase: apiCreds.APIPassphrase,
		Status:        1, // 已激活
		IsDefault:     true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := l.saveL2Account(l2Account); err != nil {
		l.Errorf("Failed to save L2 account: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to save API credentials")
	}

	l.Infof("Successfully created and saved L2 API key for wallet: %s", walletAddress)

	return apiCreds, nil
}

// CheckApiKey 检查 Polymarket L2 API Key 状态
//func (l *PolymarketL2Logic) CheckApiKey(req *types.PolymarketCreds) (interface{}, error) {
//	// 验证请求参数
//	if req.POLY_ADDRESS == "" || req.POLY_TIMESTAMP == "" || req.POLY_SIGNATURE == "" {
//		return nil, utils.NewError(utils.CodeParamError, "Missing required parameters")
//	}
//
//	address, b := middleware.GetWalletAddress(l.ctx)
//	if !b {
//		return nil, utils.NewError(utils.CodeParamError, "Missing wallet address")
//	}
//
//	if !strings.EqualFold(address, req.POLY_ADDRESS) {
//		return nil, utils.NewError(utils.CodeParamError, "Invalid wallet address")
//	}
//
//	query := model.DB.Model(&model.PolymarketL2Account{}
//		Where("wallet_address = ?", address)
//
//	var l2Account model.PolymarketL2Account
//	query.First(&l2Account)
//
//	return l2Account, nil
//}

// GetL2AccountByWallet 获取用户的默认 L2 账户
func (l *PolymarketL2Logic) GetL2AccountByWallet(walletAddress string) (*polymarket.ApiCreds, error) {
	var account model.PolymarketL2Account
	err := model.DB.Where("wallet_address = ? AND is_default = ? AND status = ?",
		walletAddress, true, 1).First(&account).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, utils.NewError(utils.CodeNotFound, "No active L2 account found")
		}
		l.Errorf("Failed to query L2 account: %v", err)
		return nil, utils.NewError(utils.CodeServerError, "Failed to query L2 account")
	}

	creds := &polymarket.ApiCreds{
		APIKey:        account.APIKey,
		APISecret:     account.APISecret,
		APIPassphrase: account.APIPassphrase,
	}

	return creds, nil
}

// SaveOrUpdateL2Account 保存或更新 L2 账户
func (l *PolymarketL2Logic) SaveOrUpdateL2Account(account *model.PolymarketL2Account) error {
	if err := model.DB.Save(account).Error; err != nil {
		l.Errorf("Failed to save L2 account: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to save L2 account")
	}
	return nil
}

// UpdateL2AccountLastUsed 更新最后使用时间
func (l *PolymarketL2Logic) UpdateL2AccountLastUsed(walletAddress string) error {
	now := time.Now()
	err := model.DB.Model(&model.PolymarketL2Account{}).
		Where("wallet_address = ?", walletAddress).
		Update("last_used_at", now).Error

	if err != nil {
		l.Errorf("Failed to update last used time: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to update account")
	}

	return nil
}

// DisableL2Account 禁用 L2 账户
func (l *PolymarketL2Logic) DisableL2Account(walletAddress string) error {
	err := model.DB.Model(&model.PolymarketL2Account{}).
		Where("wallet_address = ?", walletAddress).
		Update("status", 2).Error

	if err != nil {
		l.Errorf("Failed to disable L2 account: %v", err)
		return utils.NewError(utils.CodeServerError, "Failed to disable account")
	}

	l.Infof("Successfully disabled L2 account for wallet: %s", walletAddress)
	return nil
}

// saveL2Account 内部方法：保存 L2 账户（处理唯一约束冲突）
func (l *PolymarketL2Logic) saveL2Account(account *model.PolymarketL2Account) error {
	// 先检查是否已存在
	var existing model.PolymarketL2Account
	err := model.DB.Where("wallet_address = ?", account.WalletAddress).First(&existing).Error

	if err == nil {
		// 已存在，更新
		existing.APIKey = account.APIKey
		existing.APISecret = account.APISecret
		existing.APIPassphrase = account.APIPassphrase
		existing.Status = account.Status
		existing.UpdatedAt = time.Now()
		return model.DB.Save(&existing).Error
	}

	if err == gorm.ErrRecordNotFound {
		// 不存在，创建
		return model.DB.Create(account).Error
	}

	return err
}

//func (l *PolymarketL2Logic) PlaceOrderV2(walletAddress string) ([]*model.PolymarketL2Account, error) {
//
//	result, err := l.plmkClobClient.CreateAndPostOrderV2(args, nil, orderType, false, false)
//	if err != nil {
//		log.Fatalf("create+post v2: %v", err)
//	}
//
//	payloadJSON, _ := json.MarshalIndent(result.Payload, "", "  ")
//	fmt.Println("\n--- Signed order payload ---")
//	fmt.Println(string(payloadJSON))
//
//	respJSON, _ := json.MarshalIndent(result.Response, "", "  ")
//	fmt.Println("\n--- Server response ---")
//	fmt.Println(string(respJSON))
//
//}
