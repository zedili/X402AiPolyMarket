// API 响应基础类型
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
  timestamp: number;
}

// 错误码定义
export enum ErrorCode {
  SUCCESS = 0,
  PARAM_ERROR = 1001,
  UNAUTHORIZED = 1002,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,
  SERVER_ERROR = 1005,
  INVALID_ADDRESS = 2001,
  INVALID_SIGN = 2002,
  MARKET_NOT_FOUND = 3001,
  MARKET_CLOSED = 3002,
  INSUFFICIENT_BALANCE = 4001,
  ORDER_NOT_FOUND = 4002,
}

// ==================== 认证相关类型 ====================

export interface NonceRequest {
  wallet_address: string;
}

export interface NonceResponse {
  nonce: string;
  expires_at: string;
}

export interface LoginRequest {
  wallet_address: string;
  signature: string;
  nonce: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserInfo;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface UserInfo {
  id: number;
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  bio?: string;
  created_at: string;
  last_login_at?: string;
}

export interface UserStats {
  total_trades: number;
  total_volume: number;
  total_profit: number;
  win_count: number;
  lose_count: number;
  win_rate: number;
}

export interface UserProfileResponse extends UserInfo {
  stats?: UserStats;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar_url?: string;
  email?: string;
  bio?: string;
}

export interface PublicUserResponse {
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  stats?: UserStats;
}

// ==================== 市场相关类型 ====================

export interface CreateMarketRequest {
  question: string;
  description?: string;
  category: string;
  end_time: string;
  initial_liquidity?: number;
  tags?: string[];
}

export interface CreateMarketResponse {
  market_id: number;
  contract_address?: string;
  tx_hash?: string;
  status: string; // pending, approved
}

export interface MarketListRequest {
  page?: number;
  page_size?: number;
  category?: string;
  status?: number;
  sort?: string; // volume, created_at, end_time
  order?: string; // asc, desc
  search?: string;
  is_hot?: boolean;
}

export interface MarketListItem {
  id: number;
  question: string;
  description?: string;
  category: string;
  creator_address: string;
  contract_address?: string;
  yes_price: number;
  no_price: number;
  total_volume: number;
  total_liquidity: number;
  participant_count: number;
  ai_prediction?: number;
  confidence?: number;
  suggests?: string;
  start_time: string;
  end_time: string;
  status: number;
  is_hot: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface MarketListResponse {
  total: number;
  page: number;
  page_size: number;
  markets: MarketListItem[];
}

export interface MarketDetailResponse {
  id: number;
  question: string;
  description?: string;
  category: string;
  creator_address: string;
  contract_address?: string;
  yes_price: number;
  no_price: number;
  yes_shares: number;
  no_shares: number;
  total_volume: number;
  total_liquidity: number;
  participant_count: number;
  ai_prediction?: number;
  confidence?: number;
  suggests?: string;
  start_time: string;
  end_time: string;
  settlement_time?: string;
  status: number;
  result?: number;
  audit_status: number;
  is_hot: boolean;
  is_featured: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_favorited?: boolean;
}

export interface CategoryResponse {
  name: string;
  display_name: string;
  icon?: string;
  description?: string;
  count: number;
}

export interface HotMarketRequest {
  limit?: number;
}

// ==================== 交易相关类型 ====================

export interface CreateOrderRequest {
  market_id: number;
  order_type: number; // 0-买入 1-卖出
  position: number; // 0-NO 1-YES
  amount: number;
  price: number;
  slippage?: number; // 滑点容忍度（%）
}

export interface CreateOrderResponse {
  order_id: number;
  market_id: number;
  order_type: number;
  position: number;
  amount: number;
  price: number;
  total_value: number;
  fee: number;
  status: number;
  tx_hash?: string;
  created_at: string;
}

export interface OrderListRequest {
  page?: number;
  page_size?: number;
  market_id?: number;
  status?: number;
  order_type?: number;
}

export interface OrderInfo {
  id: number;
  market_id: number;
  market_question: string;
  order_type: number;
  order_type_name: string;
  position: number;
  position_name: string;
  amount: number;
  price: number;
  total_value: number;
  fee: number;
  filled_amount: number;
  avg_filled_price: number;
  status: number;
  status_name: string;
  tx_hash?: string;
  created_at: string;
}

export interface OrderListResponse {
  total: number;
  orders: OrderInfo[];
}

export interface OrderDetailResponse extends OrderInfo {
  updated_at: string;
  cancelled_at?: string;
  completed_at?: string;
  trades?: TradeInfo[];
}

export interface CancelOrderResponse {
  order_id: number;
  status: number;
  cancelled_at: string;
}

export interface TradeHistoryRequest {
  page?: number;
  page_size?: number;
  market_id?: number;
  start_time?: string;
  end_time?: string;
}

export interface TradeInfo {
  id: number;
  market_id: number;
  market_question: string;
  position: number;
  position_name: string;
  amount: number;
  price: number;
  total_value: number;
  fee: number;
  is_buyer: boolean;
  counterparty: string;
  tx_hash?: string;
  created_at: string;
}

export interface TradeHistoryResponse {
  total: number;
  trades: TradeInfo[];
}

export interface PositionListRequest {
  status?: string; // active, settled
}

export interface PositionInfo {
  id: number;
  market_id: number;
  market_question: string;
  market_status: number;
  position: number;
  position_name: string;
  shares: number;
  avg_price: number;
  total_cost: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  realized_pnl: number;
  is_settled: boolean;
  settlement_value?: number;
  created_at: string;
}

export interface PositionListResponse {
  positions: PositionInfo[];
}

export interface PositionDetailResponse extends PositionInfo {
  updated_at: string;
}

export interface TradingStatsResponse {
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  total_trades: number;
  total_volume: number;
  total_fees: number;
  active_positions: number;
  total_profit: number;
  win_rate: number;
}

