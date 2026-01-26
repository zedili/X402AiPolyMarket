'use client';

import { useApi } from '@/hooks/useApi';
import { tradeApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Package, DollarSign, Target } from 'lucide-react';

export function TradingStats() {
  const { data, loading, error } = useApi(tradeApi.getTradingStats);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
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

  if (!data) {
    return null;
  }

  const stats = [
    {
      label: '总订单数',
      value: data.total_orders,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      label: '活跃订单',
      value: data.active_orders,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: '总成交量',
      value: `$${(data.total_volume / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'text-purple-500',
    },
    {
      label: '胜率',
      value: `${data.win_rate.toFixed(1)}%`,
      icon: Target,
      color: 'text-orange-500',
    },
    {
      label: '总交易数',
      value: data.total_trades,
      icon: Package,
      color: 'text-cyan-500',
    },
    {
      label: '活跃持仓',
      value: data.active_positions,
      icon: TrendingUp,
      color: 'text-pink-500',
    },
    {
      label: '总收益',
      value: `$${data.total_profit.toFixed(2)}`,
      icon: DollarSign,
      color: data.total_profit >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: '总手续费',
      value: `$${data.total_fees.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-gray-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

