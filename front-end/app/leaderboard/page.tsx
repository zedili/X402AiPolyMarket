'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { leaderboardApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingUp, Users, Medal } from 'lucide-react';
import { PlatformStats } from '@/components/PlatformStats';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<string>('all');
  const [limit] = useState(100);

  const { data, loading, error, execute } = useApi(leaderboardApi.getProfitLeaderboard);

  useEffect(() => {
    execute({ period, limit });
  }, [execute, period, limit]);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">排行榜</h1>
        <p className="text-muted-foreground mt-2">查看收益排行榜和平台统计</p>
      </div>

      {/* 平台统计 */}
      <PlatformStats />

      {/* 排行榜 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                收益排行榜
              </CardTitle>
              <CardDescription>按总收益排名</CardDescription>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="week">本周</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 text-muted-foreground">
              加载失败: {error.message}
            </div>
          ) : data ? (
            <div className="space-y-2">
              {data.leaderboard.map((item, index) => (
                <LeaderboardItem key={item.address} item={item} rank={index + 1} />
              ))}
              {data.my_rank && (
                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground mb-2">我的排名</div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-primary">#{data.my_rank.rank}</div>
                      <div>
                        <div className="font-medium">我的收益</div>
                        <div className="text-sm text-muted-foreground">
                          ${data.my_rank.total_profit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardItem({
  item,
  rank,
}: {
  item: {
    rank: number;
    address: string;
    username?: string;
    avatar_url?: string;
    total_profit: number;
    win_rate: number;
    total_trades: number;
    badge?: string;
  };
  rank: number;
}) {
  const isTopThree = rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
        isTopThree ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20' : ''
      }`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
        {isTopThree ? (
          <Medal className={`h-6 w-6 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-orange-500'}`} />
        ) : (
          <span className="text-lg font-bold">#{rank}</span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold">{item.username || item.address.slice(0, 10)}...</div>
          {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            ${item.total_profit.toFixed(2)}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {item.total_trades} 交易
          </div>
          <div>胜率: {item.win_rate.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
