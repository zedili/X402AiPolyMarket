import { Market } from "@shared/schema";
import { MarketListItem } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import AILoading from "./AILoading";

interface MarketCardProps {
  market: Market | MarketListItem;
  aiLoading?: boolean;
}

// 类型守卫函数
function isMarketListItem(market: Market | MarketListItem): market is MarketListItem {
  return typeof market.id === 'number' && 'is_hot' in market;
}

export default function MarketCard({ market, aiLoading = false }: MarketCardProps) {
  // 适配API返回的数据格式
  const isApiFormat = isMarketListItem(market);
  
  const marketId = isApiFormat ? String(market.id) : market.id;
  const question = market.question;
  const description = isApiFormat ? (market.description || '') : '';
  const category = market.category;
  const isHot = isApiFormat ? market.is_hot : (market as Market).isHot;
  
  // 价格处理：API返回的是百分比(0-100)，Mock数据是cents(0-100)
  const yesPrice = isApiFormat ? Math.round(market.yes_price) : (market as Market).yesPrice;
  const noPrice = isApiFormat ? Math.round(market.no_price) : (market as Market).noPrice;
  
  // AI预测数据
  const aiPrediction = isApiFormat 
    ? (market.ai_prediction ?? undefined)
    : (market as Market).aiPrediction;
  const confidence = isApiFormat 
    ? (market.confidence ?? undefined)
    : (market as Market).confidence;
  const suggests = isApiFormat 
    ? (market.suggests ?? undefined)
    : (market as Market).suggests;
  
  // 交易量和结束时间
  const volume = isApiFormat 
    ? `$${(market.total_volume / 1000000).toFixed(1)}M`
    : (market as Market).volume;
  const endsDate = isApiFormat
    ? new Date(market.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : (market as Market).endsDate;
  
  const isYesSuggested = suggests === "YES";
  const showAILoading = aiLoading || (isApiFormat && aiPrediction === undefined && !aiLoading);

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
          {isHot && (
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse">
              HOT
            </Badge>
          )}
        </div>
        <h3 className="font-display font-semibold text-lg leading-tight min-h-[3.5rem] line-clamp-3 group-hover:text-primary/90 transition-colors">
          {market.question}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-2">
            {description}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-4 relative z-10">
        {/* AI Prediction Box */}
        <div className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-50" />
          
          <div className="relative flex justify-between items-center mb-1">
            {showAILoading ? (
              <AILoading size="sm" />
            ) : (
              <div className="flex items-center gap-1.5 text-purple-400">
                <Brain className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold tracking-wider uppercase">AI Prediction</span>
              </div>
            )}
            {suggests && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded",
                isYesSuggested ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
              )}>
                {isYesSuggested ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                Suggests: {suggests}
              </div>
            )}
          </div>

          <div className="relative flex items-baseline gap-2">
            {showAILoading ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-16 bg-purple-500/20 rounded animate-pulse" />
                <div className="h-4 w-20 bg-purple-500/20 rounded animate-pulse" />
              </div>
            ) : aiPrediction !== undefined ? (
              <>
                <span className="text-3xl font-display font-bold text-purple-100 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                  {aiPrediction}%
                </span>
                {confidence !== undefined && (
                  <span className="text-xs text-purple-300/70 font-mono">
                    {confidence}% confidence
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-purple-300/50 font-mono">
                No prediction available
              </span>
            )}
          </div>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>YES</span>
            </div>
            <div className="text-xl font-display font-bold text-green-400">
              {yesPrice}¢
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>NO</span>
            </div>
            <div className="text-xl font-display font-bold text-red-400 text-right">
              {noPrice}¢
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
          <span>Vol: {volume}</span>
          <span>Ends: {endsDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
