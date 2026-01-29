'use client';

import { useApi } from '@/hooks/useApi';
import { leaderboardApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, Activity, BrainCircuit, DollarSign } from 'lucide-react';

export function PlatformStats() {
  const { data, loading, error } = useApi(leaderboardApi.getPlatformStats);

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

  if (error || !data) {
    return null;
  }

  const stats = [
    {
      label: '总成交量',
      value: `$${(data.total_volume / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'text-blue-500',
    },
    {
      label: '活跃市场',
      value: data.active_markets.toString(),
      icon: Activity,
      color: 'text-green-500',
    },
    {
      label: '总用户数',
      value: data.total_users.toLocaleString(),
      icon: Users,
      color: 'text-purple-500',
    },
    {
      label: 'AI准确率',
      value: `${data.ai_accuracy.toFixed(1)}%`,
      icon: BrainCircuit,
      color: 'text-orange-500',
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


