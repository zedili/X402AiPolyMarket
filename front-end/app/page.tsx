'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Droplets,
  Search,
  ShieldCheck,
  WalletCards,
  Zap,
} from 'lucide-react';

import AnimatedMarketCard from '@/components/AnimatedMarketCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { marketApi } from '@/lib/api';
import type { MarketListItem } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;
const CATEGORY_OPTIONS = [
  'ALL',
  'POLITICS',
  'CRYPTO',
  'SPORTS',
  'TECH',
  'ECONOMY',
  'GENERAL',
];

export default function Home() {
  const [markets, setMarkets] = useState<MarketListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('volume');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await marketApi.getMarketList({
          page,
          page_size: PAGE_SIZE,
          category: category === 'ALL' ? undefined : category,
          search: deferredSearch || undefined,
          sort,
          order: 'desc',
        });
        if (!cancelled) {
          setMarkets(result.markets);
          setTotal(result.total);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Market data unavailable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [category, deferredSearch, page, reloadToken, sort]);

  const stats = useMemo(() => {
    const volume = markets.reduce((sum, market) => sum + market.total_volume, 0);
    const liquidity = markets.reduce(
      (sum, market) => sum + market.total_liquidity,
      0,
    );
    return [
      { label: 'Markets loaded', value: String(markets.length), icon: Activity },
      { label: 'Listed volume', value: `$${formatCompact(volume)}`, icon: Zap },
      { label: 'Listed liquidity', value: `$${formatCompact(liquidity)}`, icon: Droplets },
      { label: 'Data cache', value: '30 sec', icon: ShieldCheck },
    ];
  }, [markets]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/40 py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.18),transparent_45%)]" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl space-y-7 text-center"
          >
            <Badge variant="outline" className="border-primary/30 bg-primary/5 px-3 py-1 text-primary">
              Built for Arbitrum Open House Singapore
            </Badge>
            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
              Pay per insight,
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                not per subscription.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Signal402 turns live public prediction-market data into bounded AI
              reports for people and autonomous agents, unlocked with x402 USDC
              payments on Arbitrum.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => scrollToSection('markets')}>
                Explore live markets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection('how-it-works')}>
                See the protocol flow
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" />Non-custodial</span>
              <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-blue-400" />Public market data</span>
              <span className="flex items-center gap-1.5"><BrainCircuit className="h-4 w-4 text-purple-400" />AI on demand</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-border/40 py-16">
        <div className="container space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">One request, three steps</h2>
            <p className="mt-2 text-muted-foreground">No account balance and no platform custody.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FlowCard icon={Activity} number="01" title="Inspect" text="Read current probabilities, volume, liquidity, and resolution rules for free." />
            <FlowCard icon={WalletCards} number="02" title="Unlock" text="Approve a per-request USDC payment through the x402 flow on Arbitrum." />
            <FlowCard icon={BrainCircuit} number="03" title="Analyze" text="Receive a report with a separate estimate, evidence, counterarguments, and risks." />
          </div>
        </div>
      </section>

      <section id="markets" className="py-16 md:py-20">
        <div className="container space-y-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold">Live market snapshots</h2>
              <p className="mt-2 text-muted-foreground">
                Public probability and liquidity data from the Polymarket Gamma API.
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-emerald-500/20 text-emerald-400">
              Read-only · no trade execution
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="bg-card/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <div className="mt-2 text-2xl font-bold">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4 rounded-xl border bg-card/30 p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search the loaded market set…"
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant={sort === 'volume' ? 'default' : 'outline'} onClick={() => setSort('volume')}>Volume</Button>
                <Button variant={sort === 'end_time' ? 'default' : 'outline'} onClick={() => setSort('end_time')}>Closing soon</Button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setCategory(option);
                    setPage(1);
                  }}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    category === option
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <Card className="border-destructive/50">
              <CardHeader><CardTitle className="text-destructive">Market data unavailable</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>{error}</p>
                <Button variant="outline" onClick={() => setReloadToken((value) => value + 1)}>Retry</Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-xl border bg-card/40" />
              ))}
            </div>
          ) : markets.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {markets.map((market, index) => (
                <AnimatedMarketCard key={market.id} market={market} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
              No markets matched this filter.
            </div>
          )}

          {!loading && !error && (page > 1 || total > page * PAGE_SIZE) && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button variant="outline" disabled={markets.length < PAGE_SIZE} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function FlowCard({ icon: Icon, number, title, text }: { icon: typeof Activity; number: string; title: string; text: string }) {
  return (
    <Card className="bg-card/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className="h-6 w-6 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">{number}</span>
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="leading-7 text-muted-foreground">{text}</CardContent>
    </Card>
  );
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
