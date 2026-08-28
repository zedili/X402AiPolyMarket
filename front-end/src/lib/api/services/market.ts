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
  getMarketList: async (params?: MarketListRequest): Promise<MarketListResponse> => {
    const query = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    const response = await fetch(`/api/markets?${query}`);
    if (!response.ok) throw new Error(`Failed to load markets (${response.status})`);
    return response.json();
  },

  // 获取市场详情
  getMarketDetail: async (id: number): Promise<MarketDetailResponse> => {
    const response = await fetch(`/api/markets/${id}`);
    if (!response.ok) throw new Error(`Failed to load market (${response.status})`);
    return response.json();
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


