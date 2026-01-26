// 市场相关API
import { request } from '../client';
import type {
  CreateMarketRequest,
  CreateMarketResponse,
  MarketListRequest,
  MarketListResponse,
  MarketDetailResponse,
  CategoryResponse,
  HotMarketRequest,
  MarketListItem,
} from '../types';

export const marketApi = {
  // 获取市场列表
  getMarketList: (params?: MarketListRequest): Promise<MarketListResponse> => {
    return request.get<MarketListResponse>('/market/list', params);
  },

  // 获取市场详情
  getMarketDetail: (id: number): Promise<MarketDetailResponse> => {
    return request.get<MarketDetailResponse>(`/market/${id}`);
  },

  // 创建市场
  createMarket: (data: CreateMarketRequest): Promise<CreateMarketResponse> => {
    return request.post<CreateMarketResponse>('/market/create', data);
  },

  // 获取市场分类
  getCategories: (): Promise<CategoryResponse[]> => {
    return request.get<CategoryResponse[]>('/market/categories');
  },

  // 获取热门市场
  getHotMarkets: (params?: HotMarketRequest): Promise<MarketListItem[]> => {
    return request.get<MarketListItem[]>('/market/hot', params);
  },
};

