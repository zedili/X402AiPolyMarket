"use client";

import { useFadeInUp } from "@/hooks/useScrollAnimation";
import MarketCard from "./MarketCard";
import { MarketListItem } from "@/lib/api/types";
import Link from "next/link";

interface AnimatedMarketCardProps {
  market: MarketListItem;
  index: number;
}

export default function AnimatedMarketCard({
  market,
  index,
}: AnimatedMarketCardProps) {
  const ref = useFadeInUp({ delay: index * 0.1, start: "top 85%" });
  
  const marketId = market.id;

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <Link href={`/markets/${marketId}`} className="block h-full">
        <MarketCard market={market} />
      </Link>
    </div>
  );
}

