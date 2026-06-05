package x402

// ============================================================================
// x402 Payment-Signature 结构体
// ============================================================================

// PaymentSignature x402 支付签名完整结构
type PaymentSignature struct {
	X402Version int             `json:"x402Version"`
	Payload     PaymentPayload  `json:"payload"`
	Resource    PaymentResource `json:"resource"`
	Accepted    PaymentAccepted `json:"accepted"`
}

// PaymentPayload 支付载荷（授权 + 签名）
type PaymentPayload struct {
	Authorization PaymentAuthorization `json:"authorization"`
	Signature     string               `json:"signature"`
}

// PaymentAuthorization EVM 交易授权参数
type PaymentAuthorization struct {
	From        string `json:"from"`
	To          string `json:"to"`
	Value       string `json:"value"`
	ValidAfter  string `json:"validAfter"`
	ValidBefore string `json:"validBefore"`
	Nonce       string `json:"nonce"`
}

// PaymentResource 资源描述
type PaymentResource struct {
	URL         string `json:"url"`
	Description string `json:"description"`
	MimeType    string `json:"mimeType"`
}

// PaymentAccepted 接受的支付方式
type PaymentAccepted struct {
	Scheme            string        `json:"scheme"`
	Network           string        `json:"network"`
	Asset             string        `json:"asset"`
	Amount            string        `json:"amount"`
	PayTo             string        `json:"payTo"`
	MaxTimeoutSeconds int           `json:"maxTimeoutSeconds"`
	Extra             AcceptedExtra `json:"extra"`
}

type AcceptedExtra struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}
