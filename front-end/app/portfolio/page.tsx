"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_MARKETS } from "@shared/schema";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

const holdings = [
  { id: "1", side: "YES" as const, size: 1200, avgPrice: 0.58, pnl: 12.4 },
  { id: "3", side: "YES" as const, size: 600, avgPrice: 0.72, pnl: 8.1 },
  { id: "4", side: "NO" as const, size: 900, avgPrice: 0.41, pnl: -3.2 },
];

const history = [
  { id: "h1", market: "Bitcoin reach $100k?", side: "YES", size: 500, price: 0.62, status: "Filled", time: "1h ago" },
  { id: "h2", market: "AI surpass coding?", side: "YES", size: 300, price: 0.80, status: "Filled", time: "3h ago" },
  { id: "h3", market: "Tesla stock double?", side: "NO", size: 400, price: 0.43, status: "Open", time: "1d ago" },
];

export default function PortfolioPage() {
  const positions = useMemo(() => holdings.map(h => ({ ...h, market: MOCK_MARKETS.find(m => m.id === h.id) })), []);

  const totalValue = positions.reduce((sum, p) => {
    const markPrice = p.side === "YES" ? (p.market?.yesPrice ?? 0) / 100 : (p.market?.noPrice ?? 0) / 100;
    return sum + markPrice * p.size;
  }, 0);

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <div className="container py-12 space-y-10">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6" />
        <h1 className="text-3xl font-display font-bold">Portfolio</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <SummaryCard title="Total Value" value={`$${totalValue.toFixed(2)}`} trend={+totalPnl >= 0 ? totalPnl : undefined} />
        <SummaryCard title="P&L (today)" value={`${totalPnl.toFixed(2)}%`} trend={totalPnl} />
        <SummaryCard title="Open Positions" value={positions.length.toString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {positions.map(position => (
            <div key={position.id} className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{position.market?.question}</div>
                  <Badge variant={position.side === "YES" ? "default" : "destructive"}>{position.side}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{position.market?.category} • Ends {position.market?.endsDate}</div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Size</div>
                  <div className="font-semibold">{position.size}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avg Price</div>
                  <div className="font-semibold">${position.avgPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">P&L</div>
                  <div className={position.pnl >= 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>{position.pnl}%</div>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.map(item => (
            <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.market}</div>
                  <Badge variant={item.side === "YES" ? "default" : "destructive"}>{item.side}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{item.time} • {item.status}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>Size {item.size}</span>
                <span>Price ${item.price.toFixed(2)}</span>
                <Button variant="ghost" size="sm">Repeat</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, trend }: { title: string; value: string; trend?: number }) {
  const positive = trend !== undefined ? trend >= 0 : true;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className={positive ? "text-emerald-500 flex items-center gap-1" : "text-rose-500 flex items-center gap-1"}>
            {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {trend.toFixed(2)}%
          </div>
        )}
        <Progress value={Math.min(Math.max((trend ?? 0) + 50, 0), 100)} className="h-2" />
      </CardContent>
    </Card>
  );
}

