package types

import "time"

// ==================== 订单相关 ====================

// CreateOrderRequest 创建订单请求
type CreateOrderRequest struct {
	MarketID  uint64  `json:"market_id" validate:"required"`
	OrderType uint8   `json:"order_type" validate:"required,oneof=0 1"` // 0-买入 1-卖出
	Position  uint8   `json:"position" validate:"required,oneof=0 1"`   // 0-NO 1-YES
	Amount    float64 `json:"amount" validate:"required,gt=0"`
	Price     float64 `json:"price" validate:"required,gte=0,lte=100"`
	Slippage  float64 `json:"slippage" validate:"gte=0,lte=100"` // 滑点容忍度（%）
}

// CreateOrderResponse 创建订单响应
type CreateOrderResponse struct {
	OrderID    uint64    `json:"order_id"`
	MarketID   uint64    `json:"market_id"`
	OrderType  uint8     `json:"order_type"`
	Position   uint8     `json:"position"`
	Amount     float64   `json:"amount"`
	Price      float64   `json:"price"`
	TotalValue float64   `json:"total_value"`
	Fee        float64   `json:"fee"`
	Status     uint8     `json:"status"`
	TxHash     *string   `json:"tx_hash,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// OrderListRequest 订单列表请求
type OrderListRequest struct {
	Page      int     `json:"page"`
	PageSize  int     `json:"page_size"`
	MarketID  *uint64 `json:"market_id,omitempty"`
	Status    *uint8  `json:"status,omitempty"`
	OrderType *uint8  `json:"order_type,omitempty"`
}

// OrderListResponse 订单列表响应
type OrderListResponse struct {
	Total  int64       `json:"total"`
	Orders []OrderInfo `json:"orders"`
}

// OrderInfo 订单信息
type OrderInfo struct {
	ID              uint64    `json:"id"`
	MarketID        uint64    `json:"market_id"`
	MarketQuestion  string    `json:"market_question"`
	OrderType       uint8     `json:"order_type"`
	OrderTypeName   string    `json:"order_type_name"`
	Position        uint8     `json:"position"`
	PositionName    string    `json:"position_name"`
	Amount          float64   `json:"amount"`
	Price           float64   `json:"price"`
	TotalValue      float64   `json:"total_value"`
	Fee             float64   `json:"fee"`
	FilledAmount    float64   `json:"filled_amount"`
	AvgFilledPrice  float64   `json:"avg_filled_price"`
	Status          uint8     `json:"status"`
	StatusName      string    `json:"status_name"`
	TxHash          *string   `json:"tx_hash,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

// OrderDetailResponse 订单详情响应
type OrderDetailResponse struct {
	OrderInfo
	UpdatedAt   time.Time  `json:"updated_at"`
	CancelledAt *time.Time `json:"cancelled_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	Trades      []TradeInfo `json:"trades,omitempty"` // 关联的交易记录
}

// CancelOrderResponse 取消订单响应
type CancelOrderResponse struct {
	OrderID     uint64    `json:"order_id"`
	Status      uint8     `json:"status"`
	CancelledAt time.Time `json:"cancelled_at"`
}

// ==================== 交易记录相关 ====================

// TradeHistoryRequest 交易历史请求
type TradeHistoryRequest struct {
	Page      int        `json:"page"`
	PageSize  int        `json:"page_size"`
	MarketID  *uint64    `json:"market_id,omitempty"`
	StartTime *time.Time `json:"start_time,omitempty"`
	EndTime   *time.Time `json:"end_time,omitempty"`
}

// TradeHistoryResponse 交易历史响应
type TradeHistoryResponse struct {
	Total  int64       `json:"total"`
	Trades []TradeInfo `json:"trades"`
}

// TradeInfo 交易信息
type TradeInfo struct {
	ID              uint64    `json:"id"`
	MarketID        uint64    `json:"market_id"`
	MarketQuestion  string    `json:"market_question"`
	Position        uint8     `json:"position"`
	PositionName    string    `json:"position_name"`
	Amount          float64   `json:"amount"`
	Price           float64   `json:"price"`
	TotalValue      float64   `json:"total_value"`
	Fee             float64   `json:"fee"`
	IsBuyer         bool      `json:"is_buyer"`
	Counterparty    string    `json:"counterparty"`
	TxHash          *string   `json:"tx_hash,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

// ==================== 持仓相关 ====================

// PositionListRequest 持仓列表请求
type PositionListRequest struct {
	Status string `json:"status,omitempty"` // active, settled
}

// PositionListResponse 持仓列表响应
type PositionListResponse struct {
	Positions []PositionInfo `json:"positions"`
}

// PositionInfo 持仓信息
type PositionInfo struct {
	ID              uint64    `json:"id"`
	MarketID        uint64    `json:"market_id"`
	MarketQuestion  string    `json:"market_question"`
	MarketStatus    uint8     `json:"market_status"`
	Position        uint8     `json:"position"`
	PositionName    string    `json:"position_name"`
	Shares          float64   `json:"shares"`
	AvgPrice        float64   `json:"avg_price"`
	TotalCost       float64   `json:"total_cost"`
	CurrentPrice    float64   `json:"current_price"`
	CurrentValue    float64   `json:"current_value"`
	UnrealizedPnL   float64   `json:"unrealized_pnl"`
	UnrealizedPnLPct float64  `json:"unrealized_pnl_pct"`
	RealizedPnL     float64   `json:"realized_pnl"`
	IsSettled       bool      `json:"is_settled"`
	SettlementValue float64   `json:"settlement_value,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

// PositionDetailResponse 持仓详情响应
type PositionDetailResponse struct {
	PositionInfo
	UpdatedAt time.Time `json:"updated_at"`
	// 可以添加更多详细信息，如交易历史等
}

// ==================== 统计相关 ====================

// TradingStatsResponse 交易统计响应
type TradingStatsResponse struct {
	TotalOrders      int64   `json:"total_orders"`
	ActiveOrders     int64   `json:"active_orders"`
	CompletedOrders  int64   `json:"completed_orders"`
	TotalTrades      int64   `json:"total_trades"`
	TotalVolume      float64 `json:"total_volume"`
	TotalFees        float64   `json:"total_fees"`
	ActivePositions  int64   `json:"active_positions"`
	TotalProfit      float64 `json:"total_profit"`
	WinRate          float64 `json:"win_rate"`
}

