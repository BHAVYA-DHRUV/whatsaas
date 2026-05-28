import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  opts: { limit?: number; windowSec?: number; keyPrefix?: string } = {}
): Promise<NextResponse> {
  const limit = opts.limit ?? 120;
  const windowSec = opts.windowSec ?? 60;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const path = request.nextUrl.pathname;
  const key = `${opts.keyPrefix ?? 'api'}:${ip}:${path}`;

  const result = await rateLimit(key, limit, windowSec);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(result, limit) }
    );
  }

  const response = await handler();
  const headers = rateLimitHeaders(result, limit);
  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
