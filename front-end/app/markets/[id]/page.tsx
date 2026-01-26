"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import MarketDetail from "@/components/MarketDetail";
import { MOCK_MARKETS } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const market = useMemo(() => MOCK_MARKETS.find(m => m.id === id), [id]);

  if (!market) {
    return (
      <div className="container py-16 space-y-6">
        <div className="text-2xl font-semibold">Market not found</div>
        <Button onClick={() => router.push("/")}>Back to markets</Button>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <MarketDetail market={market} />
    </div>
  );
}

