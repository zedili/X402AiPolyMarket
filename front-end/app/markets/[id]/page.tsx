import { notFound } from "next/navigation";
import { MarketDetailPageClient } from "@/components/MarketDetailPageClient";

interface MarketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MarketDetailPage({
  params,
}: MarketDetailPageProps) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <MarketDetailPageClient marketId={Number(id)} />;
}
