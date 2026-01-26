"use client";

import { useMemo, useState } from "react";
import { Market } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowDownUp, Clock3, Flame, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketDetailProps {
  market: Market;
}

const mockTrades = [
  { id: 1, side: "YES", price: 0.67, size: 1200, time: "2m ago" },
  { id: 2, side: "NO", price: 0.32, size: 800, time: "5m ago" },
  { id: 3, side: "YES", price: 0.65, size: 1500, time: "11m ago" },
  { id: 4, side: "NO", price: 0.35, size: 500, time: "20m ago" },
];

export default function MarketDetail({ market }: MarketDetailProps) {
  const [side, setSide] = useState<"YES" | "NO">(market.suggests);
  const [amount, setAmount] = useState("100");

  const price = side === "YES" ? market.yesPrice : market.noPrice;
  const probability = useMemo(() =>
    Number(((side === "YES" ? market.yesPrice : market.noPrice) / 100).toFixed(2)),
  [side, market.yesPrice, market.noPrice]);

  const cost = useMemo(() => {
    const num = Number(amount || 0);
    return Number(((num * price) / 100).toFixed(2));
  }, [amount, price]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase">
            <Flame className="h-4 w-4" /> Trending
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight text-balance">
            {market.question}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{market.category}</Badge>
            <div className="flex items-center gap-1"><Clock3 className="h-4 w-4" /> Ends {market.endsDate}</div>
            <div className="flex items-center gap-1"><LineChart className="h-4 w-4" /> Volume {market.volume}</div>
            <div className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> AI Suggests {market.suggests}</div>
          </div>
        </div>
        <Card className="w-full md:w-80 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" />AI Signal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Prediction</span>
              <span className="text-3xl font-bold">{market.aiPrediction}%</span>
            </div>
            <Progress value={market.aiPrediction} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span>Confidence</span>
              <span className="font-semibold">{market.confidence}%</span>
            </div>
            <div className="text-xs text-muted-foreground">AI suggests a {market.suggests} position based on historical signals.</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowDownUp className="h-5 w-5" /> Trade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {(["YES", "NO"] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setSide(option)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-all",
                    option === "YES" ? "bg-emerald-500/10 border-emerald-500/40" : "bg-rose-500/10 border-rose-500/40",
                    side === option ? "ring-2 ring-offset-1 ring-primary" : "hover:scale-[1.01]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{option}</span>
                    <span className="text-sm text-muted-foreground">Prob.</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-2xl font-bold">{(option === "YES" ? market.yesPrice : market.noPrice) / 100}</span>
                    <span className="text-sm text-muted-foreground">{option === "YES" ? market.yesPrice : market.noPrice}%</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Amount (USD)</span>
                <span>Est. probability {probability}</span>
              </div>
              <Input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                inputMode="decimal"
              />
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/30 p-4 text-sm space-y-2">
              <div className="flex justify-between"><span>Average price</span><span className="font-semibold">${(price / 100).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Fees</span><span className="font-semibold">$0.00</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Cost</span><span>${cost.toFixed(2)}</span></div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1">Place {side} Order</Button>
              <Button variant="outline" className="flex-1">Add to Watchlist</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTrades.map(trade => (
              <div key={trade.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge variant={trade.side === "YES" ? "default" : "destructive"}>{trade.side}</Badge>
                  <span className="font-semibold">${trade.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Size {trade.size}</span>
                  <span>{trade.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Market Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="Volume" value={market.volume} />
            <Stat label="Ends" value={market.endsDate} />
            <Stat label="YES price" value={`$${(market.yesPrice / 100).toFixed(2)}`} />
            <Stat label="NO price" value={`$${(market.noPrice / 100).toFixed(2)}`} />
            <Stat label="AI prediction" value={`${market.aiPrediction}%`} />
            <Stat label="Confidence" value={`${market.confidence}%`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About this market</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Trade on the outcome of this event. Prices represent the probability of YES resolving true. Each share settles to $1 if correct, otherwise $0.</p>
            <p>Follow AI signals and market liquidity to time your entry. Manage risk with balanced YES/NO positions.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

