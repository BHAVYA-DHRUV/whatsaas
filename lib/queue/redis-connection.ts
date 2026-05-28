import IORedis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';

let sharedConnection: IORedis | null = null;

/** BullMQ requires maxRetriesPerRequest: null on dedicated connections. */
export function getQueueConnection(): IORedis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is required for queue workers');
  }
  if (!sharedConnection) {
    sharedConnection = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return sharedConnection;
}

/**
 * BullMQ can resolve a nested ioredis type in some installs.
 * Cast once at the boundary so the rest of the queue layer stays type-safe.
 */
export function getBullConnection(): ConnectionOptions {
  return getQueueConnection() as unknown as ConnectionOptions;
}

export function isQueueEnabled(): boolean {
  return Boolean(process.env.REDIS_URL);
}
