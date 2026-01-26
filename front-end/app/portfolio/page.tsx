'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { tradeApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { OrderList } from '@/components/OrderList';
import { PositionList } from '@/components/PositionList';
import { TradeHistory } from '@/components/TradeHistory';
import { TradingStats } from '@/components/TradingStats';
import { Wallet, Package, History, BarChart3 } from 'lucide-react';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('positions');

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">我的投资组合</h1>
        <p className="text-muted-foreground mt-2">管理您的订单、持仓和交易历史</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            持仓
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            订单
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            交易历史
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            统计
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <PositionList />
        </TabsContent>

        <TabsContent value="orders">
          <OrderList />
        </TabsContent>

        <TabsContent value="history">
          <TradeHistory />
        </TabsContent>

        <TabsContent value="stats">
          <TradingStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
