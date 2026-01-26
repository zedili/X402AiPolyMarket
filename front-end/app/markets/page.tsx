'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { marketApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, TrendingUp, Users, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { MarketListItem } from '@/lib/api/types';

export default function MarketsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState<string>('');
  const [sort, setSort] = useState<string>('volume');
  const [order, setOrder] = useState<string>('desc');

  const { data, loading, error, execute } = useApi(marketApi.getMarketList);

  useEffect(() => {
    execute({
      page,
      page_size: pageSize,
      category: category || undefined,
      search: search || undefined,
      sort,
      order: order as 'asc' | 'desc',
    });
  }, [execute, page, pageSize, category, search, sort, order]);

  const categories = [
    { value: undefined, label: '全部' },
    { value: 'CRYPTO', label: '加密货币' },
    { value: 'TECH', label: '科技' },
    { value: 'STOCKS', label: '股票' },
    { value: 'POLITICS', label: '政治' },
    { value: 'SPORTS', label: '体育' },
    { value: 'SCIENCE', label: '科学' },
  ];

  if (error) {
    return (
      <div className="container py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">加载失败</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => execute({ page, page_size: pageSize })}>重试</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* 标题和筛选 */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">市场列表</h1>
          <p className="text-muted-foreground mt-2">浏览所有预测市场</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索市场..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <Button
                key={cat.value || 'all'}
                variant={category === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.value)}
                className="whitespace-nowrap"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 排序 */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">排序:</span>
          <Button
            variant={sort === 'volume' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSort('volume')}
          >
            成交量
          </Button>
          <Button
            variant={sort === 'created_at' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSort('created_at')}
          >
            创建时间
          </Button>
          <Button
            variant={sort === 'end_time' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSort('end_time')}
          >
            结束时间
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
          >
            {order === 'desc' ? '↓' : '↑'}
          </Button>
        </div>
      </div>

      {/* 市场列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>

          {/* 分页 */}
          {data.total > pageSize && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
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
      ) : null}
    </div>
  );
}

function MarketCard({ market }: { market: MarketListItem }) {
  return (
    <Link href={`/markets/${market.id}`}>
      <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {market.question}
            </CardTitle>
            {market.is_hot && (
              <Badge variant="destructive" className="flex-shrink-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                热门
              </Badge>
            )}
          </div>
          <CardDescription className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{market.category}</Badge>
            {market.ai_prediction && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI: {market.ai_prediction}%
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 价格 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">YES</div>
              <div className="text-lg font-bold text-green-500">{market.yes_price}%</div>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">NO</div>
              <div className="text-lg font-bold text-red-500">{market.no_price}%</div>
            </div>
          </div>

          {/* 统计 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>${(market.total_volume / 1000).toFixed(1)}K</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{market.participant_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(market.end_time).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

