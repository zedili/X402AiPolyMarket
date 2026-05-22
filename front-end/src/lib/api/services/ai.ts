// AI预测相关API
import { request } from '../client';
import { callDeepSeek, callDeepSeekStream } from './deepseek';
import { WalletAdapter } from '../../x402-client';
import { marketApi } from './market';
import type {
  AIPredictionResponse,
  AIAccuracyResponse,
  MarketDetailResponse,
} from '../types';
import { set } from 'zod';
import { adapter } from 'next/dist/server/web/adapter';




// ========== 工具函数：解析 DeepSeek 纯文本为结构化数据 ==========

// 从纯文本中解析出部分预测结果（用于普通和流式模式）
function parseTextToPartialPrediction(
  text: string,
  marketId: number
): Partial<AIPredictionResponse> {
  const cleaned = text.replace(/\r/g, '');

  const getNumber = (regex: RegExp): number | undefined => {
    const m = cleaned.match(regex);
    if (!m) return undefined;
    const n = parseFloat(m[1]);
    return Number.isFinite(n) ? n : undefined;
  };

  const getString = (regex: RegExp): string | undefined => {
    const m = cleaned.match(regex);
    if (!m) return undefined;
    return m[1].trim();
  };

  const partial: Partial<AIPredictionResponse> = {
    market_id: marketId,
  };

  // 预测值 & 置信度
  const predictionValue = getNumber(/预测值[:：]\s*([0-9]{1,3}(?:\.\d+)?)/i);
  if (predictionValue !== undefined) {
    partial.prediction_value = Math.max(0, Math.min(100, predictionValue));
  }

  const confidence = getNumber(/置信度[:：]\s*([0-9]{1,3}(?:\.\d+)?)/i);
  if (confidence !== undefined) {
    partial.confidence = Math.max(0, Math.min(100, confidence));
  }

  // 建议：支持 YES/NO 以及中英文描述
  const suggestsRaw = getString(/建议[:：]\s*([^\n。；;]+)/i);
  if (suggestsRaw) {
    const v = suggestsRaw.toUpperCase();
    if (v.includes('NO') || v.includes('卖出') || v.includes('看空')) {
      partial.suggests = 'NO';
    } else {
      partial.suggests = 'YES';
    }
  }

  // 模型版本
  const modelVersion = getString(/模型版本[:：]\s*([^\n]+)/i);
  if (modelVersion) {
    partial.model_version = modelVersion;
  }

  // 历史准确率
  const historicalAccuracy = getNumber(/历史准确率[:：]\s*([0-9]{1,3}(?:\.\d+)?)/i);
  if (historicalAccuracy !== undefined) {
    partial.historical_accuracy = Math.max(70, Math.min(95, historicalAccuracy));
  }

  // 更新时间（允许任意字符串，由前端做 toLocaleString）
  const lastUpdated = getString(/更新时间[:：]\s*([^\n]+)/i);
  if (lastUpdated) {
    partial.last_updated = lastUpdated;
  }

  // 情绪/趋势/交易量指标（可选）
  const sentiment = getNumber(/情绪(?:得分)?[:：]\s*(-?[0-9]{1,3}(?:\.\d+)?)/i);
  const trend = getNumber(/趋势(?:得分)?[:：]\s*(-?[0-9]{1,3}(?:\.\d+)?)/i);
  const volume = getNumber(/交易量(?:指标)?[:：]\s*([0-9]{1,3}(?:\.\d+)?)/i);

  // 关键因素 & 风险因素文本块
  const keyBlockMatch = cleaned.match(
    /关键因素[:：]\s*([\s\S]*?)(?=(风险因素[:：]|模型版本[:：]|历史准确率[:：]|更新时间[:：]|$))/
  );
  const riskBlockMatch = cleaned.match(
    /风险因素[:：]\s*([\s\S]*?)(?=(关键因素[:：]|模型版本[:：]|历史准确率[:：]|更新时间[:：]|$))/
  );

  const splitFactors = (block?: string | null): string[] => {
    if (!block) return [];
    const raw = block
      .split(/[\n。；;]+/g)
      .map(s => s.replace(/^[\d一二三四五六七八九十]+[\.、)]\s*/, '').trim())
      .filter(Boolean);
    return raw;
  };

  const keyFactors = splitFactors(keyBlockMatch?.[1]);
  const riskFactors = splitFactors(riskBlockMatch?.[1]);

  if (
    sentiment !== undefined ||
    trend !== undefined ||
    volume !== undefined ||
    keyFactors.length > 0 ||
    riskFactors.length > 0
  ) {
    partial.analysis = {
      sentiment_score: sentiment ?? 0,
      trend_score: trend ?? 0,
      volume_indicator: volume ?? 50,
      key_factors: keyFactors,
      risk_factors: riskFactors,
    };
  }

  return partial;
}

export const aiApi = {



  // 流式获取AI预测（调用 DeepSeek API Stream）
  getPredictionStream: async (
    marketId: number,
    onChunk: (partialData: Partial<AIPredictionResponse>) => void,
    onComplete?: (fullData: AIPredictionResponse) => void,
    onError?: (error: Error) => void
  ): Promise<void> => {
    // 先获取市场详情
    const market: MarketDetailResponse = await marketApi.getMarketDetail(marketId);

    // 构建系统提示词（与非流式一致，便于流式文本解析）
    const systemPrompt = `你是一个专业的预测市场分析师。你需要基于给定的市场信息，提供专业的预测分析。
请使用简洁的中文自然语言回答，并在分析过程中或结尾处，按照以下格式依次给出字段，方便程序做流式解析和展示：
预测值: x
置信度: x
建议: YES 或 NO
关键因素:
1. 因素一
2. 因素二
风险因素:
1. 风险一
2. 风险二
情绪得分: x
趋势得分: x
交易量指标: x
模型版本: deepseek-chat-v1.0
历史准确率: x
更新时间: 2026-01-01T00:00:00Z

注意：
- 回答可以包含额外的解释性文本；
- 但字段名和「字段名: 值」这一格式必须保持一致；
- 不要返回 JSON 结构。`;

    // 构建用户提示词
    const userPrompt = `请分析以下预测市场，并提供专业的预测分析（流式输出，同样按照系统提示中的字段格式给出关键字段）：

市场问题：${market.question}
${market.description ? `市场描述：${market.description}` : ''}
分类：${market.category}
当前YES价格：${market.yes_price}%
当前NO价格：${market.no_price}%
YES份额：${market.yes_shares.toLocaleString()}
NO份额：${market.no_shares.toLocaleString()}
总成交量：$${market.total_volume.toLocaleString()}
总流动性：$${market.total_liquidity.toLocaleString()}
参与者数量：${market.participant_count}
开始时间：${new Date(market.start_time).toLocaleString('zh-CN')}
结束时间：${new Date(market.end_time).toLocaleString('zh-CN')}
${market.tags && market.tags.length > 0 ? `标签：${market.tags.join(', ')}` : ''}
${market.is_hot ? '【热门市场】' : ''}
${market.is_featured ? '【精选市场】' : ''}

请基于以上信息，综合考虑市场情绪、交易趋势、参与度、时间因素等，给出：
1. 预测值（YES结果的概率，0-100）
2. 置信度（0-100）
3. 建议（YES或NO）
4. 关键因素和风险因素
5. 情绪得分、趋势得分、交易量指标

请确保返回的JSON格式完全正确，可以直接解析。`;

    let accumulatedContent = '';
    let lastSerializedPartial: string | null = null;


    try {
    
      await callDeepSeekStream(
        userPrompt,
        systemPrompt,
        (content, reasoning) => {
          accumulatedContent = content;
          
          // 基于当前完整文本做一次解析，形成部分数据（支持流式逐步完善）
          const partialData = parseTextToPartialPrediction(accumulatedContent, marketId);

          // 如果本次解析结果与上次完全一致，则不触发回调，避免前端重复渲染
          const serialized = JSON.stringify(partialData);
          console.log('serialized', serialized);
          if (lastSerializedPartial && lastSerializedPartial.length === serialized.length) {
            return;
          }
          lastSerializedPartial = serialized;

          onChunk(partialData);
        },
       
        (error) => {
          console.error('DeepSeek Stream API 调用失败:', error);
          if (onError) {
            onError(error);
          }
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('未知错误');
      if (onError) {
        onError(err);
      }
    }
  },

  // 获取AI准确率统计
  getAccuracy: (): Promise<AIAccuracyResponse> => {
    return request.get<AIAccuracyResponse>('/ai/accuracy');
  },
};


