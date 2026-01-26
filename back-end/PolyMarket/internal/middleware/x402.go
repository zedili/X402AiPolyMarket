package middleware

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
)

// X402PaymentRequest 支付请求信息
type X402PaymentRequest struct {
	Amount    float64 `json:"amount"`    // SOL 数量
	Recipient string  `json:"recipient"` // 收款地址
	Memo      string  `json:"memo,omitempty"`
	Timestamp int64   `json:"timestamp"`
}

// X402Config X402 配置
type X402Config struct {
	Enabled   bool    `json:"Enabled" yaml:"Enabled"`
	Amount    float64 `json:"Amount" yaml:"Amount"`       // 默认服务费用
	Recipient string  `json:"Recipient" yaml:"Recipient"` // 收款地址
	RPCURL    string  `json:"RPCURL" yaml:"RPCURL"`       // Solana RPC 端点
}

// DefaultX402Config 返回默认配置
func DefaultX402Config() X402Config {
	return X402Config{
		Enabled:   true,
		Amount:    0.001, // 默认 0.001 SOL
		Recipient: "",    // 需要配置
		RPCURL:    "https://api.mainnet-beta.solana.com",
	}
}

// X402Middleware X402 支付中间件
func X402Middleware(config X402Config) func(http.HandlerFunc) http.HandlerFunc {
	if !config.Enabled {
		// 如果未启用，直接返回原始处理器
		return func(next http.HandlerFunc) http.HandlerFunc {
			return next
		}
	}

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			// 检查是否已支付（通过请求头中的签名验证）
			paymentSignature := r.Header.Get("X-Payment-Signature")

			if paymentSignature == "" {
				// 返回 402 支付请求
				paymentReq := X402PaymentRequest{
					Amount:    config.Amount,
					Recipient: config.Recipient,
					Memo:      "AI Prediction Service Fee",
					Timestamp: time.Now().Unix(),
				}

				if paymentReq.Recipient == "" {
					logx.Error("X402 recipient not configured")
					http.Error(w, "Payment service not configured", http.StatusInternalServerError)
					return
				}

				send402Response(w, paymentReq)
				return
			}

			// 验证支付签名（这里需要实现 Solana 交易验证逻辑）
			if !verifyPayment(paymentSignature, config) {
				logx.Errorf("Invalid payment signature: %s", paymentSignature)
				http.Error(w, "Invalid payment signature", http.StatusPaymentRequired)
				return
			}

			// 支付验证通过，继续处理请求
			next(w, r)
		}
	}
}

// send402Response 发送 HTTP 402 响应
func send402Response(w http.ResponseWriter, paymentReq X402PaymentRequest) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Payment-Required", "true")
	w.Header().Set("X-Payment-Amount", strconv.FormatFloat(paymentReq.Amount, 'f', -1, 64))
	w.Header().Set("X-Payment-Recipient", paymentReq.Recipient)
	if paymentReq.Memo != "" {
		w.Header().Set("X-Payment-Memo", paymentReq.Memo)
	}
	w.Header().Set("X-Payment-Timestamp", strconv.FormatInt(paymentReq.Timestamp, 10))
	w.WriteHeader(http.StatusPaymentRequired)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":   "Payment Required",
		"message": "This service requires payment. Please send the specified amount to the recipient address.",
		"payment": paymentReq,
	})
}

// verifyPayment 验证支付签名（需要实现 Solana 交易验证）
func verifyPayment(signature string, config X402Config) bool {
	// TODO: 实现 Solana 交易签名验证
	// 1. 通过 RPC 获取交易详情
	// 2. 验证交易是否已确认
	// 3. 验证收款地址和金额是否正确
	// 4. 验证交易时间戳是否在有效期内（例如：5分钟内）

	logx.Infof("Verifying payment signature: %s", signature)

	// 临时实现：检查签名格式（实际需要调用 Solana RPC 验证）
	if len(signature) < 64 {
		return false
	}

	// 实际实现应该：
	// 1. 使用 Solana RPC 客户端获取交易
	// 2. 验证交易状态
	// 3. 验证交易详情（收款地址、金额等）
	// 4. 检查是否在时间窗口内（防止重放攻击）

	return true // 临时返回 true，实际需要实现验证逻辑
}
