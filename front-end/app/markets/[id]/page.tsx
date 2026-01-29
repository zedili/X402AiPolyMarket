'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { marketApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { MarketDetailContent } from '@/components/MarketDetailContent';

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const marketId = id ? parseInt(id, 10) : 0;

  // 传入稳定的 API 函数，把参数通过 execute 传入，避免每次渲染都创建新函数导致 useEffect 反复触发
  const { data: market, loading, error, execute } = useApi(marketApi.getMarketDetail);

  useEffect(() => {
    if (marketId) {
      execute(marketId);
    }
  }, [execute, marketId]);

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="container py-16 space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">市场不存在</CardTitle>
            <CardDescription>{error?.message || '未找到该市场'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/#markets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回市场列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/#markets')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回
      </Button>

      <MarketDetailContent market={market} />
    </div>
  );
}

