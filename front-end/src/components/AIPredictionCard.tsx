'use client';

import { useEffect, useState, useRef } from 'react';
import { aiApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import CountUp from 'react-countup';
import type { AIPredictionResponse } from '@/lib/api/types';

interface AIPredictionCardProps {
  marketId: number;
}

export function AIPredictionCard({ marketId }: AIPredictionCardProps) {
  const [data, setData] = useState<Partial<AIPredictionResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [displayedKeyFactors, setDisplayedKeyFactors] = useState<string[]>([]);
  const [displayedRiskFactors, setDisplayedRiskFactors] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isTypingRef = useRef<{ keyFactors: boolean; riskFactors: boolean }>({
    keyFactors: false,
    riskFactors: false,
  });
  // 避免在 React 严格模式下初次挂载时重复发起请求
  const lastRequestedMarketIdRef = useRef<number | null>(null);

  // 打字机效果：逐步显示文本数组
  const typewriterEffect = (
    items: string[],
    setDisplayed: (items: string[]) => void,
    type: 'keyFactors' | 'riskFactors',
    delay: number = 30
  ) => {
    // 如果正在打字，直接更新显示（不打断）
    if (isTypingRef.current[type]) {
      setDisplayed(items);
      return;
    }

    // 清除之前的定时器
    typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    typingTimeoutsRef.current = [];
    isTypingRef.current[type] = true;

    const displayed: string[] = [];
    let currentIndex = 0;
    let currentItemIndex = 0;

    const typeNext = () => {
      if (currentItemIndex >= items.length) {
        isTypingRef.current[type] = false;
        return;
      }

      const currentItem = items[currentItemIndex];
      if (currentIndex < currentItem.length) {
        // 逐步显示当前项的字符
        const partial = currentItem.substring(0, currentIndex + 1);
        const newDisplayed = [...displayed];
        newDisplayed[currentItemIndex] = partial;
        setDisplayed([...newDisplayed]);
        currentIndex++;
        
        const timeout = setTimeout(typeNext, delay);
        typingTimeoutsRef.current.push(timeout);
      } else {
        // 当前项完成，开始下一项
        displayed[currentItemIndex] = currentItem;
        currentItemIndex++;
        currentIndex = 0;
        
        if (currentItemIndex < items.length) {
          const timeout = setTimeout(typeNext, delay * 2); // 项之间稍长延迟
          typingTimeoutsRef.current.push(timeout);
        } else {
          isTypingRef.current[type] = false;
        }
      }
    };

    typeNext();
  };

  // 组件挂载或 marketId 变化时自动发起流式请求
  useEffect(() => {
    if (!marketId) return;

    // 如果当前 marketId 已经请求过，避免在严格模式下重复触发
    if (lastRequestedMarketIdRef.current === marketId) {
      return;
    }
    lastRequestedMarketIdRef.current = marketId;

    // 清理之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // 重置状态
    setLoading(true);
    setError(null);
    setData(null);
    setDisplayedKeyFactors([]);
    setDisplayedRiskFactors([]);
    typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    typingTimeoutsRef.current = [];

    // 调用流式 API
    aiApi.getPredictionStream(
      marketId,
      (partialData) => {
        console.log('partialData', partialData);
        // 一旦收到任何分片（哪怕还没解析出 prediction_value/confidence），就先结束骨架屏
        // 否则如果 JSON 结构较晚才闭合，会导致页面长时间停留在 Skeleton
        setLoading(false);

        // 更新部分数据
        setData(prev => {
          const newData = { ...prev, ...partialData };
          return newData;
        });

        // 如果有关键因素，实时更新（流式更新时直接显示，不打字机）
        if (partialData.analysis?.key_factors && partialData.analysis.key_factors.length > 0) {
          const factors = partialData.analysis.key_factors;
          // 流式更新时直接显示，不使用打字机效果
          // 停止打字机效果（如果正在运行）
          if (isTypingRef.current.keyFactors) {
            typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            typingTimeoutsRef.current = [];
            isTypingRef.current.keyFactors = false;
          }
          setDisplayedKeyFactors(factors);
        }

        // 如果有风险因素，实时更新
        if (partialData.analysis?.risk_factors && partialData.analysis.risk_factors.length > 0) {
          const factors = partialData.analysis.risk_factors;
          // 停止打字机效果（如果正在运行）
          if (isTypingRef.current.riskFactors) {
            typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            typingTimeoutsRef.current = [];
            isTypingRef.current.riskFactors = false;
          }
          setDisplayedRiskFactors(factors);
        }
      },
      (fullData) => {
        // 完成时设置完整数据
        setData(fullData);
        setLoading(false);
        
        // 完成时触发打字机效果显示最终内容
        if (fullData.analysis?.key_factors && fullData.analysis.key_factors.length > 0) {
          typewriterEffect(fullData.analysis.key_factors, setDisplayedKeyFactors, 'keyFactors', 30);
        } else {
          setDisplayedKeyFactors([]);
        }
        
        if (fullData.analysis?.risk_factors && fullData.analysis.risk_factors.length > 0) {
          typewriterEffect(fullData.analysis.risk_factors, setDisplayedRiskFactors, 'riskFactors', 30);
        } else {
          setDisplayedRiskFactors([]);
        }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [marketId]);

  // 仅在“正在加载且还没有任何数据”时展示骨架屏
  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">加载失败</CardTitle>
          <CardDescription>{error?.message || '无法加载AI预测'}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 没有错误，但也还没有任何数据（理论上只会在 very early render 瞬间出现）
  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI预测
          </CardTitle>
          <CardDescription>基于机器学习模型的预测分析</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 预测值 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-sm text-muted-foreground mb-1">预测值</div>
              <div className="text-3xl font-bold text-purple-500">
                {data.prediction_value !== undefined ? (
                  <CountUp
                    start={0}
                    end={data.prediction_value}
                    duration={1.2}
                    suffix="%"
                    decimals={Number.isInteger(data.prediction_value) ? 0 : 1}
                    easingFn={(t, b, c, d) => {
                      // easeOutCubic：开始快，结束慢
                      const progress = t / d - 1;
                      return c * (progress * progress * progress + 1) + b;
                    }}
                  />
                ) : (
                  '--'
                )}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-sm text-muted-foreground mb-1">置信度</div>
              <div className="text-3xl font-bold text-blue-500">
                {data.confidence !== undefined ? (
                  <CountUp
                    start={0}
                    end={data.confidence}
                    duration={1.2}
                    suffix="%"
                    decimals={Number.isInteger(data.confidence) ? 0 : 1}
                    easingFn={(t, b, c, d) => {
                      // easeOutCubic：开始快，结束慢
                      const progress = t / d - 1;
                      return c * (progress * progress * progress + 1) + b;
                    }}
                  />
                ) : (
                  '--'
                )}
              </div>
            </div>
          </div>

          {/* 建议 */}
          {data.suggests && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-semibold">AI建议</span>
              </div>
              <Badge variant={data.suggests === 'YES' ? 'default' : 'secondary'} className="text-lg">
                {data.suggests}
              </Badge>
            </div>
          )}

          {/* 关键因素 */}
          {data.analysis && (displayedKeyFactors.length > 0 || data.analysis.key_factors?.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-semibold">关键因素</span>
              </div>
              <ul className="space-y-1">
                {(data.analysis.key_factors || []).map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span className="whitespace-pre-wrap">
                      {displayedKeyFactors[index] !== undefined ? displayedKeyFactors[index] : factor}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 风险因素 */}
          {data.analysis && (displayedRiskFactors.length > 0 || data.analysis.risk_factors?.length > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">风险因素</span>
              </div>
              <ul className="space-y-1">
                {(data.analysis.risk_factors || []).map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    <span className="whitespace-pre-wrap">
                      {displayedRiskFactors[index] !== undefined ? displayedRiskFactors[index] : factor}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 其他信息：仅保留历史准确率 */}
          {data.historical_accuracy !== undefined && (
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">历史准确率:</span>
                <span className="font-medium">{data.historical_accuracy}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


