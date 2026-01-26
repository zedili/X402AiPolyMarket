"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

const leaders = [
  { rank: 1, name: "AlphaTrader", pnl: 42.5, volume: "$1.2M", winRate: 68 },
  { rank: 2, name: "SignalSeeker", pnl: 35.1, volume: "$980K", winRate: 65 },
  { rank: 3, name: "ChainOracle", pnl: 28.3, volume: "$860K", winRate: 62 },
  { rank: 4, name: "DeFiWhale", pnl: 22.7, volume: "$740K", winRate: 59 },
  { rank: 5, name: "QuantAI", pnl: 18.9, volume: "$630K", winRate: 57 },
];

export default function LeaderboardPage() {
  return (
    <div className="container py-12 space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6" />
        <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Traders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaders.map(leader => (
            <div key={leader.rank} className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">#{leader.rank}</Badge>
                <div>
                  <div className="font-semibold">{leader.name}</div>
                  <div className="text-xs text-muted-foreground">Volume {leader.volume}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-emerald-500 font-semibold">P&L {leader.pnl}%</div>
                <div className="w-32">
                  <Progress value={leader.winRate} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">Win {leader.winRate}%</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
