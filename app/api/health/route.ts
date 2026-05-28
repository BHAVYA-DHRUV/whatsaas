import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { getRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = { app: 'ok' };

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }
  } else {
    checks.redis = 'disabled';
  }

  const healthy = checks.database === 'ok';
  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
