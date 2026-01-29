"use client";

import { useFadeInUp } from "@/hooks/useScrollAnimation";
import MarketCard from "./MarketCard";
import { Market } from "@shared/schema";
import { MarketListItem } from "@/lib/api/types";
import Link from "next/link";

interface AnimatedMarketCardProps {
  market: Market | MarketListItem;
  index: number;
  aiLoading?: boolean;
}

export default function AnimatedMarketCard({
  market,
  index,
  aiLoading = false,
}: AnimatedMarketCardProps) {
  const ref = useFadeInUp({ delay: index * 0.1, start: "top 85%" });
  
  // 获取市场ID（适配两种格式）
  const marketId = typeof market.id === 'number' ? market.id : parseInt(market.id);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <Link href={`/markets/${marketId}`} className="block h-full">
        <MarketCard market={market} aiLoading={aiLoading} />
      </Link>
    </div>
  );
}

