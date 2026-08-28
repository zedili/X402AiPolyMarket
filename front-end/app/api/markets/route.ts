import { NextRequest, NextResponse } from 'next/server';

import { listPolymarketMarkets } from '@/lib/polymarket';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  try {
    const markets = await listPolymarketMarkets({
      page: Number(params.get('page') ?? 1),
      pageSize: Number(params.get('page_size') ?? 20),
      category: params.get('category') ?? undefined,
      search: params.get('search') ?? undefined,
      sort: params.get('sort') ?? undefined,
      order: params.get('order') === 'asc' ? 'asc' : 'desc',
    });
    return NextResponse.json(markets, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Market data unavailable';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
