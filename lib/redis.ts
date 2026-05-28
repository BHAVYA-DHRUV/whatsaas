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
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 5000,
    });
    client = instance as RedisClient;
    return client;
  } catch {
    console.warn('[redis] REDIS_URL set but ioredis is not installed. Run: pnpm add ioredis');
    client = null;
    return null;
  }
}
