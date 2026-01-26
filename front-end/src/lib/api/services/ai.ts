// AI预测相关API
import { request } from '../client';
import type {
  AIPredictionResponse,
  AIAccuracyResponse,
} from '../types';

export const aiApi = {
  // 获取AI预测
  getPrediction: (marketId: number): Promise<AIPredictionResponse> => {
    return request.get<AIPredictionResponse>(`/ai/prediction/${marketId}`);
  },

  // 获取AI准确率统计
  getAccuracy: (): Promise<AIAccuracyResponse> => {
    return request.get<AIAccuracyResponse>('/ai/accuracy');
  },
};

