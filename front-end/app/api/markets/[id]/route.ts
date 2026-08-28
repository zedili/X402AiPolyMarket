import { NextResponse } from 'next/server';

import { getPolymarketMarket } from '@/lib/polymarket';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const market = await getPolymarketMarket(id);
    return NextResponse.json(market, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Market not found';
    const status = message === 'Invalid market id' ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
