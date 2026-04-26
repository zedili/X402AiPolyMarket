'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { walletApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { WalletTransaction } from '@/lib/api/types';

export function WalletTransactions() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [txType, setTxType] = useState<number | undefined>();

  const { data, loading, error, execute } = useApi(walletApi.getTransactions);

  useEffect(() => {
    execute({ page, page_size: pageSize, tx_type: txType });
  }, [execute, page, pageSize, txType]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
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

  if (!data || data.transactions.length === 0) {
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
      {/* 筛选 */}
      <Select
        value={txType?.toString() || 'all'}
        onValueChange={(v) => setTxType(v === 'all' ? undefined : parseInt(v))}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="筛选类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部类型</SelectItem>
          <SelectItem value="0">充值</SelectItem>
          <SelectItem value="1">提现</SelectItem>
          <SelectItem value="2">交易</SelectItem>
          <SelectItem value="3">奖励</SelectItem>
          <SelectItem value="4">手续费</SelectItem>
        </SelectContent>
      </Select>

      {/* 交易列表 */}
      <div className="space-y-2">
        {data.transactions.map((tx) => (
          <TransactionCard key={tx.id} transaction={tx} />
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

function TransactionCard({ transaction }: { transaction: WalletTransaction }) {
  const isPositive = transaction.amount >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge>{transaction.tx_type_name}</Badge>
              {transaction.remark && (
                <span className="text-sm text-muted-foreground">{transaction.remark}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(transaction.created_at).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-lg font-bold flex items-center gap-1 ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? '+' : ''}
              {transaction.amount.toFixed(2)} {transaction.currency}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              余额: {transaction.balance_after.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


