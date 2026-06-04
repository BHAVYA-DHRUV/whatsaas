import 'server-only';

type RedisClient = {
  ping: () => Promise<string>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: string, ttl?: number) => Promise<string | null>;
  incr: (key: string) => Promise<number>;
  del: (key: string) => Promise<number>;
  quit: () => Promise<void>;
};

let client: RedisClient | null | undefined;

/**
 * Optional Redis — returns null when REDIS_URL is unset (single-node mode).
 * Install ioredis on production: pnpm add ioredis
 */
export function getRedis(): RedisClient | null {
  if (client !== undefined) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis');
    const instance = new IORedis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        const delay = Math.min(times * 300, 1000);
        return delay;
      },
      keepAlive: 30000,
      enableOfflineQueue: true,
    });
    instance.on('error', (err: Error) => {
      // Log Redis errors for monitoring but don't crash
      console.error('[Redis] Connection error:', err.message);
    });
    instance.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
    client = instance as RedisClient;
    return client;
  } catch (err: unknown) {
    console.error('[Redis] Failed to initialize:', err instanceof Error ? err.message : err);
    client = null;
    return null;
  }
}
