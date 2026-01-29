'use client';

import { useEffect, useCallback, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { marketApi, request } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MarketListItem } from '@/lib/api/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_ADDRESS = '0xf0aC9747345c23B6ba451d9103F8C2785800998D';

export default function AdminMarketsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data, loading, error, execute } = useApi(marketApi.getMarketList);

  const isAdmin =
    !!user && user.wallet_address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  const loadPendingMarkets = useCallback(() => {
    if (!isAdmin || !isAuthenticated || !user) return;
    execute({
      page: 1,
      page_size: 50,
      pending_only: true,
      admin_address: user.wallet_address,
      sort: 'created_at',
      order: 'desc',
    });
  }, [execute, isAdmin, isAuthenticated, user]);

  useEffect(() => {
    loadPendingMarkets();
  }, [loadPendingMarkets]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>审批中心</CardTitle>
            <CardDescription>仅管理员地址可以访问此页面。</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                当前钱包地址无管理员权限，请使用管理员地址登录：
                {ADMIN_ADDRESS}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">市场审批中心</h1>
        <p className="text-muted-foreground mt-2">查看并审批待审核的市场（当前仅支持查看）。</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : data && data.markets.length > 0 ? (
        <div className="space-y-4">
          {data.markets.map((market) => (
            <MarketPendingCard
              key={market.id}
              market={market}
              onActionCompleted={loadPendingMarkets}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>暂无待审批市场</CardTitle>
            <CardDescription>当前没有 audit_status = pending 的市场。</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

interface MarketPendingCardProps {
  market: MarketListItem;
  onActionCompleted: () => void;
}

function MarketPendingCard({ market, onActionCompleted }: MarketPendingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await request.post(`/admin/market/${market.id}/approve`);
      toast.success('审核通过成功');
      onActionCompleted();
    } catch (err: any) {
      toast.error('审核通过失败', {
        description: err?.message ?? '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await request.post(`/admin/market/${market.id}/reject`);
      toast.success('已拒绝该市场');
      onActionCompleted();
    } catch (err: any) {
      toast.error('拒绝失败', {
        description: err?.message ?? '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async () => {
    setLoading(true);
    try {
      await request.post(`/admin/market/${market.id}/settle`);
      toast.success('强制结算成功');
      onActionCompleted();
    } catch (err: any) {
      toast.error('强制结算失败', {
        description: err?.message ?? '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{market.question}</CardTitle>
            <CardDescription className="mt-2">
              <Badge variant="outline" className="mr-2">
                {market.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                创建者：{market.creator_address}
              </span>
            </CardDescription>
          </div>
          <Badge variant="secondary">待审核</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleApprove} disabled={loading}>
          审核通过
        </Button>
        <Button variant="outline" onClick={handleReject} disabled={loading}>
          拒绝
        </Button>
        <Button variant="destructive" onClick={handleSettle} disabled={loading}>
          强制结算
        </Button>
      </CardContent>
    </Card>
  );
}


