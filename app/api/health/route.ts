import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { getRedis } from '@/lib/redis';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { isQueueEnabled } from '@/lib/queue/redis-connection';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = { app: 'ok' };
  const details: Record<string, any> = {};

  // Database check
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = 'ok';
    details.database_latency = `${Date.now() - start}ms`;
  } catch (error: any) {
    checks.database = 'error';
    details.database_error = error.message;
  }

  // Redis check
  const redis = getRedis();
  if (redis) {
    try {
      const start = Date.now();
      await redis.ping();
      checks.redis = 'ok';
      details.redis_latency = `${Date.now() - start}ms`;
    } catch (error: any) {
      checks.redis = 'error';
      details.redis_error = error.message;
    }
  } else {
    checks.redis = 'disabled';
  }

  // Evolution API check
  try {
    const evoConfig = await getEvolutionConfig();
    const start = Date.now();
    const response = await fetch(`${evoConfig.apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { apikey: evoConfig.apiKey },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      checks.evolution_api = 'ok';
      details.evolution_latency = `${Date.now() - start}ms`;
    } else {
      checks.evolution_api = 'error';
      details.evolution_status = response.status;
    }
  } catch (error: any) {
    checks.evolution_api = 'error';
    details.evolution_error = error.message;
  }

  // BullMQ check
  if (isQueueEnabled()) {
    checks.bullmq = 'enabled';
  } else {
    checks.bullmq = 'disabled';
  }

  // Socket.IO check (via health endpoint)
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const start = Date.now();
    const response = await fetch(`${socketUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const data = await response.json();
      checks.socket = 'ok';
      details.socket_connections = data.socketConnections;
      details.socket_redis = data.redis;
      details.socket_latency = `${Date.now() - start}ms`;
    } else {
      checks.socket = 'error';
      details.socket_status = response.status;
    }
  } catch (error: any) {
    checks.socket = 'error';
    details.socket_error = error.message;
  }

  const healthy = checks.database === 'ok';
  return NextResponse.json(
    { 
      status: healthy ? 'healthy' : 'degraded', 
      checks, 
      details,
      ts: new Date().toISOString() 
    },
    { status: healthy ? 200 : 503 }
  );
}
