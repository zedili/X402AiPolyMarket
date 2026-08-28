import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { ready: Boolean(process.env.DEEPSEEK_API_KEY) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
