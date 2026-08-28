import { Activity, Brain, CalendarClock, Droplets } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { MarketListItem } from '@/lib/api/types';

interface MarketCardProps {
  market: MarketListItem;
}

export default function MarketCard({ market }: MarketCardProps) {
  const labels =
    (market.metadata?.outcome_labels as string[] | undefined) ?? ['Yes', 'No'];
  const endsDate = new Date(market.end_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_var(--color-primary)]">
      <div className="pointer-events-none absolute -inset-px bg-gradient-to-b from-primary/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <CardHeader className="relative z-10 space-y-2 p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary"
          >
            {market.category}
          </Badge>
          {market.is_hot && (
            <Badge className="border-orange-500/20 bg-orange-500/10 text-orange-500">
              ACTIVE
            </Badge>
          )}
        </div>
        <h3 className="line-clamp-3 min-h-[3.5rem] text-lg font-semibold leading-tight transition-colors group-hover:text-primary/90">
          {market.question}
        </h3>
        {market.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {market.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="relative z-10 space-y-4 p-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Probability label={labels[0]} value={market.yes_price} tone="green" />
          <Probability label={labels[1]} value={market.no_price} tone="red" />
        </div>

        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-sm text-purple-200">
          <div className="flex items-center gap-2 font-medium">
            <Brain className="h-4 w-4" />
            AI deep report available on demand
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative z-10 grid grid-cols-2 gap-3 p-4 pt-0 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          ${(market.total_volume / 1_000_000).toFixed(1)}M volume
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Droplets className="h-3.5 w-3.5" />
          ${(market.total_liquidity / 1_000).toFixed(0)}K liquidity
        </div>
        <div className="col-span-2 flex items-center gap-1.5 border-t pt-3">
          <CalendarClock className="h-3.5 w-3.5" />
          Resolves {endsDate}
        </div>
      </CardFooter>
    </Card>
  );
}

function Probability({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'red';
}) {
  const colors =
    tone === 'green'
      ? 'border-green-500/20 bg-green-500/5 text-green-400'
      : 'border-red-500/20 bg-red-500/5 text-red-400';
  return (
    <div className={`rounded-lg border p-3 ${colors}`}>
      <div className="truncate text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value.toFixed(1)}%</div>
    </div>
  );
}
