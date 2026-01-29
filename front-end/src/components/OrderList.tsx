'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { tradeApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { OrderInfo } from '@/lib/api/types';

export function OrderList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState<number | undefined>();
  const [orderType, setOrderType] = useState<number | undefined>();

  const { data, loading, error, execute } = useApi(tradeApi.getOrderList);

  useEffect(() => {
    execute({
      page,
      page_size: pageSize,
      status,
      order_type: orderType,
    });
  }, [execute, page, pageSize, status, orderType]);

  const handleCancel = async (orderId: number) => {
    try {
      await tradeApi.cancelOrder(orderId);
      toast.success('订单已取消');
      execute({ page, page_size: pageSize, status, order_type: orderType });
    } catch (err: any) {
      toast.error('取消订单失败', {
        description: err.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 筛选：始终展示 */}
      <div className="flex gap-2">
        <Select
          value={status?.toString() || 'all'}
          onValueChange={(v) => setStatus(v === 'all' ? undefined : parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">待成交</SelectItem>
            <SelectItem value="1">部分成交</SelectItem>
            <SelectItem value="2">完全成交</SelectItem>
            <SelectItem value="3">已取消</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={orderType?.toString() || 'all'}
          onValueChange={(v) => setOrderType(v === 'all' ? undefined : parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="0">买入</SelectItem>
            <SelectItem value="1">卖出</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 列表区域：根据状态切换，但不影响上方筛选 */}
      {loading ? (
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
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : !data || data.orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            暂无订单
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 订单列表 */}
          <div className="space-y-4">
            {data.orders.map((order) => (
              <OrderCard key={order.id} order={order} onCancel={handleCancel} />
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
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onCancel,
}: {
  order: OrderInfo;
  onCancel: (id: number) => void;
}) {
  const canCancel = order.status === 0 || order.status === 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link href={`/markets/${order.market_id}`} className="hover:text-primary">
                {order.market_question}
              </Link>
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2">
                <Badge variant={order.order_type === 0 ? 'default' : 'secondary'}>
                  {order.order_type_name}
                </Badge>
                <Badge variant={order.position === 1 ? 'default' : 'outline'}>
                  {order.position_name}
                </Badge>
                <Badge>{order.status_name}</Badge>
              </div>
            </CardDescription>
          </div>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(order.id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">数量</div>
            <div className="font-medium">{order.amount}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">价格</div>
            <div className="font-medium">{order.price} cents</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">已成交</div>
            <div className="font-medium">{order.filled_amount}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">总价值</div>
            <div className="font-medium">${order.total_value.toFixed(2)}</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          创建时间: {new Date(order.created_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}


