import 'server-only';

import { getCacheConnection } from '@/lib/redis/connection-manager';

type RedisClient = {
  ping: () => Promise<string>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode?: string, ttl?: number) => Promise<string | null>;
  incr: (key: string) => Promise<number>;
  del: (key: string) => Promise<number>;
  quit: () => Promise<"OK">;
  keys: (pattern: string) => Promise<string[]>;
  ttl: (key: string) => Promise<number>;
};

let client: RedisClient | null | undefined;

/**
 * Optional Redis — returns null when REDIS_URL is unset (single-node mode).
 * Uses centralized connection manager for cache operations.
 */
export function getRedis(): RedisClient | null {
  if (client !== undefined) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return null;
  }

  try {
    const connection = getCacheConnection();
    if (!connection) {
      client = null;
      return null;
    }
    client = connection as RedisClient;
    return client;
  } catch (err: unknown) {
    console.error('[Redis] Failed to initialize:', err instanceof Error ? err.message : err);
    client = null;
    return null;
  }
}
