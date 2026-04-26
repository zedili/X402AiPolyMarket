'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { tradeApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import type { PositionInfo } from '@/lib/api/types';

export function PositionList() {
  const [status, setStatus] = useState<string | undefined>();

  const { data, loading, error, execute } = useApi(tradeApi.getPositionList);

  useEffect(() => {
    execute({ status });
  }, [execute, status]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.positions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          暂无持仓
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 筛选 */}
      <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? undefined : v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="筛选状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="active">活跃</SelectItem>
          <SelectItem value="settled">已结算</SelectItem>
        </SelectContent>
      </Select>

      {/* 持仓列表 */}
      <div className="space-y-4">
        {data.positions.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}
      </div>
    </div>
  );
}

function PositionCard({ position }: { position: PositionInfo }) {
  const isProfit = position.unrealized_pnl >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link href={`/markets/${position.market_id}`} className="hover:text-primary">
                {position.market_question}
              </Link>
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2">
                <Badge variant={position.position === 1 ? 'default' : 'outline'}>
                  {position.position_name}
                </Badge>
                {position.is_settled && <Badge variant="secondary">已结算</Badge>}
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">持仓数量</div>
            <div className="text-lg font-bold">{position.shares}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">平均成本</div>
            <div className="text-lg font-bold">{position.avg_price} cents</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">当前价格</div>
            <div className="text-lg font-bold">{position.current_price} cents</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">未实现盈亏</div>
            <div
              className={`text-lg font-bold flex items-center gap-1 ${
                isProfit ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {position.unrealized_pnl >= 0 ? '+' : ''}
              {position.unrealized_pnl.toFixed(2)} ({position.unrealized_pnl_pct >= 0 ? '+' : ''}
              {position.unrealized_pnl_pct.toFixed(2)}%)
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">总成本</div>
            <div className="font-medium">${position.total_cost.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">当前价值</div>
            <div className="font-medium">${position.current_value.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


