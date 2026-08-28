"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { marketApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { MarketDetailContent } from "@/components/MarketDetailContent";

interface MarketDetailPageClientProps {
  marketId: number;
}

export function MarketDetailPageClient({
  marketId,
}: MarketDetailPageClientProps) {
  const router = useRouter();
  const {
    data: market,
    loading,
    error,
    execute,
  } = useApi(marketApi.getMarketDetail);

  useEffect(() => {
    execute(marketId);
  }, [execute, marketId]);

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="container py-16 space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Market unavailable
            </CardTitle>
            <CardDescription>
              {error?.message || "This market could not be found."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/#markets")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to markets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <Button variant="ghost" onClick={() => router.push("/#markets")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <MarketDetailContent market={market} />
    </div>
  );
}
