// 交易相关API
import { request } from '../client';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderListRequest,
  OrderListResponse,
  OrderDetailResponse,
  CancelOrderResponse,
  TradeHistoryRequest,
  TradeHistoryResponse,
  PositionListRequest,
  PositionListResponse,
  PositionDetailResponse,
  TradingStatsResponse,
} from '../types';

export const tradeApi = {
  // 创建订单
  createOrder: (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return request.post<CreateOrderResponse>('/trade/order', data);
  },

  // 获取订单列表
  getOrderList: (params?: OrderListRequest): Promise<OrderListResponse> => {
    return request.get<OrderListResponse>('/trade/orders', params);
  },

  // 获取订单详情
  getOrderDetail: (id: number): Promise<OrderDetailResponse> => {
    return request.get<OrderDetailResponse>(`/trade/order/${id}`);
  },

  // 取消订单
  cancelOrder: (id: number): Promise<CancelOrderResponse> => {
    return request.post<CancelOrderResponse>(`/trade/order/${id}/cancel`);
  },

  // 获取交易历史
  getTradeHistory: (params?: TradeHistoryRequest): Promise<TradeHistoryResponse> => {
    return request.get<TradeHistoryResponse>('/trade/history', params);
  },

  // 获取持仓列表
  getPositionList: (params?: PositionListRequest): Promise<PositionListResponse> => {
    return request.get<PositionListResponse>('/trade/positions', params);
  },

  // 获取持仓详情
  getPositionDetail: (id: number): Promise<PositionDetailResponse> => {
    return request.get<PositionDetailResponse>(`/trade/position/${id}`);
  },

  // 获取交易统计
  getTradingStats: (): Promise<TradingStatsResponse> => {
    return request.get<TradingStatsResponse>('/trade/stats');
  },
};


