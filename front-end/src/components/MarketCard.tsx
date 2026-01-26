import { Market } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  const isYesSuggested = market.suggests === "YES";

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_var(--color-primary)] hover:-translate-y-1">
      {/* Glow effects */}
      <div className="absolute -inset-px bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <CardHeader className="p-4 pb-2 space-y-2 relative z-10">
        <div className="flex justify-between items-start">
          <Badge 
            variant="outline" 
            className="bg-primary/5 text-primary border-primary/20 font-mono text-[10px] tracking-wider uppercase"
          >
            {market.category}
          </Badge>
          {market.isHot && (
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse">
              HOT
            </Badge>
          )}
        </div>
        <h3 className="font-display font-semibold text-lg leading-tight min-h-[3.5rem] line-clamp-3 group-hover:text-primary/90 transition-colors">
          {market.question}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-4 relative z-10">
        {/* AI Prediction Box */}
        <div className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-50" />
          
          <div className="relative flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5 text-purple-400">
              <Brain className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold tracking-wider uppercase">AI Prediction</span>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded",
              isYesSuggested ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
            )}>
              {isYesSuggested ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              Suggests: {market.suggests}
            </div>
          </div>

          <div className="relative flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-purple-100 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
              {market.aiPrediction}%
            </span>
            <span className="text-xs text-purple-300/70 font-mono">
              {market.confidence}% confidence
            </span>
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>YES</span>
            </div>
            <div className="text-xl font-display font-bold text-green-400">
              {market.yesPrice}¢
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>NO</span>
            </div>
            <div className="text-xl font-display font-bold text-red-400 text-right">
              {market.noPrice}¢
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-3 relative z-10">
        <Button 
          className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 hover:border-green-400 hover:shadow-[0_0_15px_-5px_rgba(74,222,128,0.5)] transition-all"
        >
          BUY YES
        </Button>
        <Button 
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 hover:border-red-400 hover:shadow-[0_0_15px_-5px_rgba(248,113,113,0.5)] transition-all"
        >
          BUY NO
        </Button>
        
        <div className="col-span-2 flex justify-between items-center mt-2 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span>Vol: {market.volume}</span>
          <span>Ends: {market.endsDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
