package aiPrediction

import (
	"X402AiPolyMarket/PolyMarket/internal/model"
	"context"
	"errors"

	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

type PredictionPaymentLogic struct {
	logx.Logger
	ctx context.Context
}

func NewPredictionPaymentLogic(ctx context.Context) *PredictionPaymentLogic {
	return &PredictionPaymentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
	}
}

/**
 * 检测用户是否已经支付预测
 * @param userAddress 用户地址
 * @param cacheKey 缓存key
 * @return bool 是否已经支付
 * @return *model.Payment 预测支付记录
 * @return error 错误
 */
func (l *PredictionPaymentLogic) ChenckUserPaidPrediction(userAddress string, cacheKey string) (bool, *model.Payment, error) {
	//cacheKey = "deepseek:dfae6c7f6a8ed33f35c636900c8fb33852b813f6702fd8e30b2661faa8d116c0" // TODO: 临时测试
	var payment model.Payment
	// 1、先检查是否存在支付记录
	err := model.DB.Where("user_address = ? and cache_key = ?",
		userAddress,
		cacheKey,
	).
		Order("created_at DESC").
		First(&payment).
		Error

	// 其他异常，返回错误
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		l.Errorf("Failed to check payment: %v", err)
		return false, nil, err
	}

	// 无记录异常，创建一条待支付记录
	if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		// 找不到支付记录，新增一条待支付的记录
		newPayment := &model.Payment{
			UserAddress: userAddress,
			Status:      model.PaymentStatusPending,
			CacheKey:    cacheKey,
		}
		if err := model.DB.Create(newPayment).Error; err != nil {
			l.Errorf("Failed to create payment: %v", err)
			return false, nil, err
		}
		// 返回刚创建的待支付记录
		payment = *newPayment
	}

	return payment.IsCompleted(), &payment, nil
}

/**
 * 创建待支付预测支付记录
 * @param userAddress 用户地址
 * @param marketId 市场ID
 * @param predictionLogId 预测记录ID
 * @param prediction 预测结果
 * @param amount 金额
 * @param currency 货币
 * @return *model.Payment 预测支付记录
 * @return error 错误
 */
func (l *PredictionPaymentLogic) UpdatePaymentInfo(userAddress string, paymentAmount string, currency string, cacheKey string) (*model.Payment, error) {
	payment := model.Payment{}
	err := model.DB.Where("cache_key = ? and user_address = ?", cacheKey, userAddress).
		Order("id DESC").
		First(&payment).Error
	if err != nil {
		l.Errorf("Failed to find payment: %v", err)
		return nil, err
	}

	err = model.DB.Model(&payment).
		Updates(model.Payment{
			Currency:      currency,
			PaymentAmount: paymentAmount,
		}).Error

	if err != nil {
		l.Errorf("Failed to update payment: %v", err)
		return nil, err
	}
	l.Infof("更新支付记录成功，支付ID: %d，用户: %s，金额: %.2f %s", payment.ID, userAddress, paymentAmount, currency)
	return &payment, err
}

func (l *PredictionPaymentLogic) UpdatePaymentTxHash(cacheKey string, userAddress string, txHash string) error {
	payment := model.Payment{}
	err := model.DB.Where("cache_key = ? and user_address = ?", cacheKey, userAddress).
		Order("id DESC").
		First(&payment).Error
	if err != nil {
		l.Errorf("Failed to find payment: %v", err)
		return err
	}

	//payment.TxHash = &txHash
	payment.MarkAsPaid(txHash, 0)

	err = model.DB.Model(&payment).
		Updates(model.Payment{
			TxHash:      &txHash,
			PaidAt:      payment.PaidAt,
			Status:      payment.Status,
			BlockNumber: payment.BlockNumber,
		}).Error
	if err != nil {
		l.Errorf("Failed to update payment: %v", err)
		return err
	} else {
		l.Infof("更新支付记录成功，支付ID: %d，用户: %s，交易哈希: %s", payment.ID, userAddress, txHash)
		return nil
	}

}
