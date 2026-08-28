'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, Sparkles, ExternalLink, Droplets } from 'lucide-react';
import { AIPredictionCard } from './AIPredictionCard';
import type { MarketDetailResponse } from '@/lib/api/types';

interface MarketDetailContentProps {
  market: MarketDetailResponse;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

const statusLabels: Record<number, string> = {
  0: 'Upcoming',
  1: 'Active',
  2: 'Closed',
  3: 'Resolved',
};

export function MarketDetailContent({ market }: MarketDetailContentProps) {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const requestedTab = window.location.hash.slice(1);
    if (['overview', 'ai', 'info'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, []);

  const outcomeLabels =
    (market.metadata?.outcome_labels as string[] | undefined) ?? ['Yes', 'No'];
  const sourceUrl = market.metadata?.source_url as string | undefined;

  return (
    <div className="space-y-6">
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
                  Hot
                </Badge>
              )}
              {market.is_featured && (
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="text-green-500">
                Polymarket snapshot
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-green-500">{outcomeLabels[0]}</CardTitle>
              <CardDescription>Market-implied probability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-500">{market.yes_price}%</div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-500">{outcomeLabels[1]}</CardTitle>
              <CardDescription>Market-implied probability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-500">{market.no_price}%</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai">AI report</TabsTrigger>
          <TabsTrigger value="info">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatUsd(market.total_volume)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Liquidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatUsd(market.total_liquidity)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Resolution date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {new Date(market.end_time).toLocaleString('en-US')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <AIPredictionCard marketId={market.id} />
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge>{statusLabels[market.status] ?? 'Unknown'}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(market.created_at).toLocaleString('en-US')}</span>
              </div>
              {market.contract_address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condition ID:</span>
                  <span className="font-mono text-xs">{market.contract_address.slice(0, 10)}...</span>
                </div>
              )}
              {sourceUrl && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Source:</span>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    View on Polymarket
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {market.metadata?.resolution_source && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution source</CardTitle>
              </CardHeader>
              <CardContent className="break-all text-sm text-muted-foreground">
                {String(market.metadata.resolution_source)}
              </CardContent>
            </Card>
          )}

          {market.tags && market.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
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


