'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Clock, Sparkles, AlertCircle, Info } from 'lucide-react';
import { CreateOrderForm } from './CreateOrderForm';
import { AIPredictionCard } from './AIPredictionCard';
// import { useMarketPrice } from '@/hooks/useWebSocket';
import type { MarketDetailResponse } from '@/lib/api/types';
import { useAuth } from '../hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MarketDetailContentProps {
  market: MarketDetailResponse;
}

export function MarketDetailContent({ market }: MarketDetailContentProps) {
  // const { priceData, isConnected } = useMarketPrice(market.id);
  const [activeTab, setActiveTab] = useState('overview');

  const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>请先连接钱包登录后再进行交易</AlertDescription>
      </Alert>
    );
  }

  // 使用实时价格或市场数据
  // const yesPrice = priceData?.yes_price ?? market.yes_price;
  // const noPrice = priceData?.no_price ?? market.no_price;

  return (
    <div className="space-y-6">
      {/* 标题和基本信息 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{market.question}</h1>
            {market.description && (
              <p className="text-muted-foreground">{market.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline">{market.category}</Badge>
              {market.is_hot && (
                <Badge variant="destructive">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  热门
                </Badge>
              )}
              {market.is_featured && (
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  精选
                </Badge>
              )}
              {/* {isConnected && (
                <Badge variant="outline" className="text-green-500">
                  实时
                </Badge>
              )} */}
            </div>
          </div>
        </div>

        {/* 价格卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-green-500">YES</CardTitle>
              <CardDescription>支持该结果的价格</CardDescription>
            </CardHeader>
            <CardContent>
              {/* <div className="text-4xl font-bold text-green-500">{yesPrice}%</div> */}
              <div className="text-sm text-muted-foreground mt-2">
                份额: {market.yes_shares.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-500">NO</CardTitle>
              <CardDescription>反对该结果的价格</CardDescription>
            </CardHeader>
            <CardContent>
              {/* <div className="text-4xl font-bold text-red-500">{noPrice}%</div> */}
              <div className="text-sm text-muted-foreground mt-2">
                份额: {market.no_shares.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 标签页内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="trade">交易</TabsTrigger>
          <TabsTrigger value="ai">AI分析</TabsTrigger>
          <TabsTrigger value="info">详情</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  总成交量
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(market.total_volume / 1000).toFixed(1)}K
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  参与者
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{market.participant_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  结束时间
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {new Date(market.end_time).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trade">
          {market.status !== 1 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  市场不可交易
                </CardTitle>
                <CardDescription>
                  当前市场状态为
                  {market.status === 0 && '「待开始」'}
                  {market.status === 2 && '「已结束」'}
                  {market.status === 3 && '「已结算」'}
                  ，暂不支持创建订单。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <CreateOrderForm marketId={market.id} />
          )}
        </TabsContent>

        <TabsContent value="ai">
          <AIPredictionCard marketId={market.id} />
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>市场信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态:</span>
                <Badge>
                  {market.status === 0 && '待开始'}
                  {market.status === 1 && '进行中'}
                  {market.status === 2 && '已结束'}
                  {market.status === 3 && '已结算'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间:</span>
                <span>{new Date(market.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建者:</span>
                <span className="font-mono text-xs">{market.creator_address.slice(0, 10)}...</span>
              </div>
              {market.contract_address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">合约地址:</span>
                  <span className="font-mono text-xs">{market.contract_address.slice(0, 10)}...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {market.tags && market.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>标签</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {market.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


