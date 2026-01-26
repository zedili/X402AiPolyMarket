// 排行榜相关API
import { request } from '../client';
import type {
  LeaderboardRequest,
  LeaderboardResponse,
  PlatformStatsResponse,
} from '../types';

export const leaderboardApi = {
  // 获取收益排行榜
  getProfitLeaderboard: (params?: LeaderboardRequest): Promise<LeaderboardResponse> => {
    return request.get<LeaderboardResponse>('/leaderboard/profit', params);
  },

  // 获取平台统计
  getPlatformStats: (): Promise<PlatformStatsResponse> => {
    return request.get<PlatformStatsResponse>('/stats/platform');
  },
};

