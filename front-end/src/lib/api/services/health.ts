// 健康检查API
import { request } from '../client';

export const healthApi = {
  // 健康检查
  check: (): Promise<{ status: string }> => {
    return request.get<{ status: string }>('/health');
  },
};

