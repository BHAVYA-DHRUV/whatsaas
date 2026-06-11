import type { ConnectionOptions } from 'bullmq';
import { getWorkerConnection } from '@/lib/redis/connection-manager';

/** BullMQ requires maxRetriesPerRequest: null on dedicated connections. */
export function getQueueConnection() {
  const connection = getWorkerConnection();
  if (!connection) {
    throw new Error('REDIS_URL is required for queue workers');
  }
  return connection;
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
