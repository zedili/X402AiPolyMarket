package aiPrediction

import (
	"X402AiPolyMarket/PolyMarket/internal/model"
	"context"

	"github.com/zeromicro/go-zero/core/logx"
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
	var payment model.Payment

	// 通过cacheKey查询缓存
	err := model.DB.Where("user_address = ? and status = ?",
		userAddress,
		model.PaymentStatusPaid,
	).
		Joins("JOIN ai_prediction_logs ON payments.prediction_log_id = ai_prediction_logs.id").
		Where("ai_prediction_logs.cache_key = ?", cacheKey).
		First(&payment).
		Error
	if err != nil {
		l.Errorf("Failed to find payment: %v", err)
		// 未找到预测支付记录
		return false, nil, err
	}

	l.Infof("用户 %s 已支付预测 %s，支付ID: %d", userAddress, cacheKey, payment.ID)
	// 找到预测支付记录
	return true, &payment, err
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
func (l *PredictionPaymentLogic) CreatePendingPayment(userAddress string, marketId uint64, predictionLogId uint64, prediction uint8, amount float64, currency string) (*model.Payment, error) {
	payment := model.Payment{
		UserAddress:     userAddress,
		MarketID:        marketId,
		PredictionLogID: &predictionLogId,
		Prediction:      prediction,
		PaymentAmount:   amount,
		Currency:        currency,
		Status:          model.PaymentStatusPending,
	}

	err := model.DB.Create(&payment).Error
	if err != nil {
		l.Errorf("Failed to create payment: %v", err)
		return nil, err
	}
	l.Infof("创建支付记录成功，支付ID: %d，用户: %s，金额: %.2f %s", payment.ID, userAddress, amount, currency)
	return &payment, err

}
