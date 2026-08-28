import 'server-only';

import type {
  MarketDetailResponse,
  MarketListItem,
  MarketListResponse,
} from '@/lib/api/types';

const GAMMA_API_URL = 'https://gamma-api.polymarket.com';

type GammaEvent = {
  slug?: string;
  title?: string;
  category?: string;
  series?: Array<{ slug?: string; title?: string }>;
  eventMetadata?: { context_description?: string };
};

type GammaMarket = {
  id: string;
  question?: string;
  conditionId?: string;
  slug?: string;
  description?: string;
  resolutionSource?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume?: string;
  volumeNum?: number;
  volume24hr?: number;
  liquidity?: string;
  liquidityNum?: number;
  active?: boolean;
  closed?: boolean;
  featured?: boolean;
  restricted?: boolean;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  submitted_by?: string;
  resolvedBy?: string;
  category?: string;
  sportsMarketType?: string;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  oneDayPriceChange?: number;
  events?: GammaEvent[];
};

export type MarketQuery = {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};

function parseStringArray(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function toNumber(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveCategory(market: GammaMarket): string {
  if (market.sportsMarketType) return 'SPORTS';

  const event = market.events?.[0];
  const text = [
    market.category,
    market.question,
    market.slug,
    event?.category,
    event?.title,
    event?.series?.[0]?.slug,
    event?.series?.[0]?.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/bitcoin|ethereum|crypto|solana|token|defi/.test(text)) return 'CRYPTO';
  if (/election|president|congress|senate|minister|politic|government/.test(text)) {
    return 'POLITICS';
  }
  if (/mlb|nba|nfl|nhl|soccer|football|tennis|sports|ufc|cricket/.test(text)) {
    return 'SPORTS';
  }
  if (/ai|technology|tech|software|apple|google|microsoft|openai/.test(text)) {
    return 'TECH';
  }
  if (/fed|inflation|gdp|stock|nasdaq|s&p|economy|rate cut/.test(text)) {
    return 'ECONOMY';
  }
  return 'GENERAL';
}

function normalizeMarket(market: GammaMarket): MarketDetailResponse {
  const outcomes = parseStringArray(market.outcomes);
  const prices = parseStringArray(market.outcomePrices).map(toNumber);
  const firstProbability = Math.max(0, Math.min(1, prices[0] ?? 0));
  const secondProbability = Math.max(
    0,
    Math.min(1, prices[1] ?? 1 - firstProbability),
  );
  const event = market.events?.[0];
  const sourceUrl = `https://polymarket.com/event/${event?.slug ?? market.slug ?? market.id}`;
  const now = new Date().toISOString();

  return {
    id: Number(market.id),
    question: market.question ?? 'Untitled market',
    description: market.description,
    category: deriveCategory(market),
    creator_address: market.submitted_by ?? market.resolvedBy ?? '',
    contract_address: market.conditionId,
    yes_price: Number((firstProbability * 100).toFixed(2)),
    no_price: Number((secondProbability * 100).toFixed(2)),
    yes_shares: 0,
    no_shares: 0,
    total_volume: toNumber(market.volumeNum ?? market.volume),
    total_liquidity: toNumber(market.liquidityNum ?? market.liquidity),
    participant_count: 0,
    start_time: market.startDate ?? market.createdAt ?? now,
    end_time: market.endDate ?? now,
    status: market.active && !market.closed ? 1 : market.closed ? 2 : 0,
    audit_status: 1,
    is_hot: toNumber(market.volume24hr) >= 100_000,
    is_featured: market.featured === true,
    tags: [deriveCategory(market)],
    metadata: {
      provider: 'Polymarket Gamma API',
      source_url: sourceUrl,
      polymarket_slug: market.slug,
      event_slug: event?.slug,
      outcome_labels: outcomes.length >= 2 ? outcomes : ['Yes', 'No'],
      resolution_source: market.resolutionSource,
      context: event?.eventMetadata?.context_description,
      restricted: market.restricted === true,
      volume_24h: toNumber(market.volume24hr),
      best_bid: market.bestBid,
      best_ask: market.bestAsk,
      last_trade_price: market.lastTradePrice,
      one_day_price_change: market.oneDayPriceChange,
      fetched_at: now,
    },
    created_at: market.createdAt ?? now,
    updated_at: market.updatedAt ?? now,
  };
}

function toListItem(market: MarketDetailResponse): MarketListItem {
  return {
    id: market.id,
    question: market.question,
    description: market.description,
    category: market.category,
    creator_address: market.creator_address,
    contract_address: market.contract_address,
    yes_price: market.yes_price,
    no_price: market.no_price,
    total_volume: market.total_volume,
    total_liquidity: market.total_liquidity,
    participant_count: market.participant_count,
    start_time: market.start_time,
    end_time: market.end_time,
    status: market.status,
    is_hot: market.is_hot,
    is_featured: market.is_featured,
    created_at: market.created_at,
    metadata: market.metadata,
  };
}

async function gammaFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${GAMMA_API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Polymarket request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function listPolymarketMarkets(
  query: MarketQuery = {},
): Promise<MarketListResponse> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(query.pageSize ?? 20)));
  const hasLocalFilters = Boolean(query.category || query.search);
  const upstreamLimit = hasLocalFilters ? 100 : pageSize;
  const offset = hasLocalFilters ? 0 : (page - 1) * pageSize;
  const orderMap: Record<string, string> = {
    volume: 'volume24hr',
    created_at: 'createdAt',
    end_time: 'endDate',
  };
  const params = new URLSearchParams({
    limit: String(upstreamLimit),
    offset: String(offset),
    active: 'true',
    closed: 'false',
    order: orderMap[query.sort ?? 'volume'] ?? 'volume24hr',
    ascending: String(query.order === 'asc'),
  });

  const upstream = await gammaFetch<GammaMarket[]>(`/markets?${params}`);
  const search = query.search?.trim().toLowerCase();
  const category = query.category?.trim().toUpperCase();
  const filtered = upstream
    .map(normalizeMarket)
    .filter((market) => !category || market.category === category)
    .filter(
      (market) =>
        !search ||
        market.question.toLowerCase().includes(search) ||
        market.description?.toLowerCase().includes(search),
    );
  const paged = hasLocalFilters
    ? filtered.slice((page - 1) * pageSize, page * pageSize)
    : filtered;

  return {
    total:
      (page - 1) * pageSize +
      paged.length +
      (upstream.length === upstreamLimit ? 1 : 0),
    page,
    page_size: pageSize,
    markets: paged.map(toListItem),
  };
}

export async function getPolymarketMarket(
  id: string | number,
): Promise<MarketDetailResponse> {
  const normalizedId = String(id);
  if (!/^\d+$/.test(normalizedId)) {
    throw new Error('Invalid market id');
  }
  return normalizeMarket(
    await gammaFetch<GammaMarket>(`/markets/${encodeURIComponent(normalizedId)}`),
  );
}
