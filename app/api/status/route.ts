import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { getRedis } from '@/lib/redis';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { isQueueEnabled } from '@/lib/queue/redis-connection';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status: Record<string, any> = {
    uptime_sec: process.uptime(),
    timestamp: new Date().toISOString(),
    os: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      total_mem: os.totalmem(),
      free_mem: os.freemem(),
      cpus: os.cpus().length,
      load_avg: os.loadavg(),
    },
    process: {
      pid: process.pid,
      memory: process.memoryUsage(),
      node_version: process.version,
    },
    services: {},
  };

  // 1. Database operational status
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    status.services.database = {
      status: 'healthy',
      latency_ms: Date.now() - start,
    };
  } catch (error: any) {
    status.services.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // 2. Redis operational status
  const redis = getRedis();
  if (redis) {
    try {
      const start = Date.now();
      await redis.ping();
      status.services.redis = {
        status: 'healthy',
        latency_ms: Date.now() - start,
      };
    } catch (error: any) {
      status.services.redis = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  } else {
    status.services.redis = {
      status: 'disabled',
    };
  }

  // 3. Evolution API operational status
  try {
    const evoConfig = await getEvolutionConfig();
    const start = Date.now();
    const response = await fetch(`${evoConfig.apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { apikey: evoConfig.apiKey },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      status.services.evolution_api = {
        status: 'healthy',
        latency_ms: Date.now() - start,
      };
    } else {
      status.services.evolution_api = {
        status: 'degraded',
        http_code: response.status,
      };
    }
  } catch (error: any) {
    status.services.evolution_api = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // 4. BullMQ Status
  status.services.bullmq = {
    status: isQueueEnabled() ? 'enabled' : 'disabled',
  };

  // 5. Socket.IO status
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const start = Date.now();
    const response = await fetch(`${socketUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const data = await response.json();
      status.services.socket_io = {
        status: 'healthy',
        connections: data.socketConnections,
        redis_sync: data.redis,
        latency_ms: Date.now() - start,
      };
    } else {
      status.services.socket_io = {
        status: 'degraded',
        http_code: response.status,
      };
    }
  } catch (error: any) {
    status.services.socket_io = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  const isHealthy =
    status.services.database.status === 'healthy' &&
    (status.services.redis.status === 'healthy' || status.services.redis.status === 'disabled');

  return NextResponse.json(status, { status: isHealthy ? 200 : 503 });
}
