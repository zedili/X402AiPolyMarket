'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { tradeApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { TradeInfo } from '@/lib/api/types';

export function TradeHistory() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const { data, loading, error, execute } = useApi(tradeApi.getTradeHistory);

  useEffect(() => {
    execute({ page, page_size: pageSize });
  }, [execute, page, pageSize]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
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

  if (!data || data.trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          暂无交易记录
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {data.trades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>

      {/* 分页 */}
      {data.total > pageSize && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            上一页
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            第 {page} 页，共 {Math.ceil(data.total / pageSize)} 页
          </span>
          <Button
            variant="outline"
            disabled={page >= Math.ceil(data.total / pageSize)}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}

function TradeCard({ trade }: { trade: TradeInfo }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/markets/${trade.market_id}`} className="hover:text-primary font-medium">
              {trade.market_question}
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={trade.position === 1 ? 'default' : 'outline'}>
                {trade.position_name}
              </Badge>
              <Badge variant={trade.is_buyer ? 'default' : 'secondary'}>
                {trade.is_buyer ? '买入' : '卖出'}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">${trade.total_value.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              {trade.amount} @ {trade.price} cents
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          {new Date(trade.created_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}


