"use client";

import { useFadeInUp } from "@/hooks/useScrollAnimation";
import MarketCard from "./MarketCard";
import { Market } from "@shared/schema";
import Link from "next/link";

interface AnimatedMarketCardProps {
  market: Market;
  index: number;
}

export default function AnimatedMarketCard({
  market,
  index,
}: AnimatedMarketCardProps) {
  const ref = useFadeInUp({ delay: index * 0.1, start: "top 85%" });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      <Link href={`/markets/${market.id}`} className="block h-full">
      <MarketCard market={market} />
      </Link>
    </div>
  );
}

