'use client';

import { useApi } from '@/hooks/useApi';
import { aiApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AIPredictionCardProps {
  marketId: number;
}

export function AIPredictionCard({ marketId }: AIPredictionCardProps) {
  const { data, loading, error } = useApi(() => aiApi.getPrediction(marketId));

  if (loading) {
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

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">加载失败</CardTitle>
          <CardDescription>{error?.message || '无法加载AI预测'}</CardDescription>
        </CardHeader>
      </Card>
    );
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
              <div className="text-3xl font-bold text-purple-500">{data.prediction_value}%</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-sm text-muted-foreground mb-1">置信度</div>
              <div className="text-3xl font-bold text-blue-500">{data.confidence}%</div>
            </div>
          </div>

          {/* 建议 */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold">AI建议</span>
            </div>
            <Badge variant={data.suggests === 'YES' ? 'default' : 'secondary'} className="text-lg">
              {data.suggests}
            </Badge>
          </div>

          {/* 关键因素 */}
          {data.analysis.key_factors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-semibold">关键因素</span>
              </div>
              <ul className="space-y-1">
                {data.analysis.key_factors.map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 风险因素 */}
          {data.analysis.risk_factors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">风险因素</span>
              </div>
              <ul className="space-y-1">
                {data.analysis.risk_factors.map((factor, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 其他信息 */}
          <div className="pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">历史准确率:</span>
              <span className="font-medium">{data.historical_accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">模型版本:</span>
              <span className="font-medium">{data.model_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">更新时间:</span>
              <span className="font-medium">
                {new Date(data.last_updated).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

