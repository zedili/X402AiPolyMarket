'use client';

import { useApi } from '@/hooks/useApi';
import { walletApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, History, DollarSign } from 'lucide-react';
import { WalletBalance } from '@/components/WalletBalance';
import { WalletTransactions } from '@/components/WalletTransactions';

export default function WalletPage() {
  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">钱包</h1>
        <p className="text-muted-foreground mt-2">查看余额和交易流水</p>
      </div>

      <Tabs defaultValue="balance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            余额
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            交易流水
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <WalletBalance />
        </TabsContent>

        <TabsContent value="transactions">
          <WalletTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}


