import IORedis from 'ioredis';

/**
 * Centralized Redis Connection Manager
 * 
 * Maintains separate connections for different use cases to prevent:
 * - Connection exhaustion
 * - Subscriber/publisher conflicts
 * - ECONNABORTED errors
 * - Reconnect storms
 * 
 * Connection types:
 * - publisher: For pub/sub publishing (pusher-server)
 * - subscriber: For pub/sub subscription (socket-server)
 * - worker: For BullMQ queue operations
 * - cache: For general caching operations
 */

type ConnectionType = 'publisher' | 'subscriber' | 'worker' | 'cache';

interface RedisConnectionConfig {
  maxRetriesPerRequest: number | null;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
  connectTimeout: number;
  keepAlive: number;
  enableOfflineQueue: boolean;
  retryStrategy?: (times: number) => number | null;
}

const CONNECTION_CONFIGS: Record<ConnectionType, RedisConnectionConfig> = {
  publisher: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000,
    keepAlive: 30000,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
      if (times > 5) return null;
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  },
  subscriber: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    connectTimeout: 10000,
    keepAlive: 30000,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
      if (times > 10) return null;
      const delay = Math.min(1000 * Math.pow(2, times), 30000);
      return delay;
    },
  },
  worker: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    connectTimeout: 10000,
    keepAlive: 30000,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
      if (times > 10) return null;
      const delay = Math.min(1000 * Math.pow(2, times), 30000);
      return delay;
    },
  },
  cache: {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 5000,
    keepAlive: 30000,
    enableOfflineQueue: true,
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      const delay = Math.min(times * 300, 1000);
      return delay;
    },
  },
};

class RedisConnectionManager {
  private connections: Map<ConnectionType, IORedis | null> = new Map();
  private connectionStatus: Map<ConnectionType, boolean> = new Map();
  private reconnectAttempts: Map<ConnectionType, number> = new Map();
  private readonly redisUrl: string;

  constructor() {
    this.redisUrl = process.env.REDIS_URL || '';
    if (!this.redisUrl) {
      console.warn('[RedisConnectionManager] REDIS_URL not configured');
    }
  }

  private getConnectionConfig(type: ConnectionType): RedisConnectionConfig {
    return CONNECTION_CONFIGS[type];
  }

  private setupConnectionEvents(connection: IORedis, type: ConnectionType): void {
    connection.on('connect', () => {
      this.connectionStatus.set(type, true);
      this.reconnectAttempts.set(type, 0);
      console.log(`[RedisConnectionManager] ${type} connected`);
    });

    connection.on('ready', () => {
      this.connectionStatus.set(type, true);
      this.reconnectAttempts.set(type, 0);
      console.log(`[RedisConnectionManager] ${type} ready`);
    });

    connection.on('error', (err: Error) => {
      this.connectionStatus.set(type, false);
      console.error(`[RedisConnectionManager] ${type} error:`, err.message);
    });

    connection.on('close', () => {
      this.connectionStatus.set(type, false);
      console.warn(`[RedisConnectionManager] ${type} connection closed`);
    });

    connection.on('reconnecting', (delay: number) => {
      const attempts = (this.reconnectAttempts.get(type) || 0) + 1;
      this.reconnectAttempts.set(type, attempts);
      console.log(`[RedisConnectionManager] ${type} reconnecting in ${delay}ms (attempt ${attempts})`);
    });
  }

  getConnection(type: ConnectionType): IORedis | null {
    if (!this.redisUrl) {
      console.warn(`[RedisConnectionManager] Cannot create ${type} connection: REDIS_URL not set`);
      return null;
    }

    // Return existing connection if available
    const existing = this.connections.get(type);
    if (existing) {
      return existing;
    }

    try {
      const config = this.getConnectionConfig(type);
      const connection = new IORedis(this.redisUrl, config);
      
      this.setupConnectionEvents(connection, type);
      this.connections.set(type, connection);
      this.connectionStatus.set(type, false);

      console.log(`[RedisConnectionManager] Created ${type} connection`);
      return connection;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[RedisConnectionManager] Failed to create ${type} connection:`, message);
      return null;
    }
  }

  isConnectionReady(type: ConnectionType): boolean {
    return this.connectionStatus.get(type) || false;
  }

  async disconnect(type?: ConnectionType): Promise<void> {
    if (type) {
      const connection = this.connections.get(type);
      if (connection) {
        await connection.quit();
        this.connections.delete(type);
        this.connectionStatus.delete(type);
        this.reconnectAttempts.delete(type);
        console.log(`[RedisConnectionManager] Disconnected ${type}`);
      }
    } else {
      // Disconnect all connections
      const disconnectPromises = Array.from(this.connections.entries()).map(
        async ([connType, connection]) => {
          if (connection) {
            await connection.quit();
            console.log(`[RedisConnectionManager] Disconnected ${connType}`);
          }
        }
      );
      await Promise.all(disconnectPromises);
      this.connections.clear();
      this.connectionStatus.clear();
      this.reconnectAttempts.clear();
    }
  }

  getHealthStatus(): Record<ConnectionType, boolean> {
    const status: Record<ConnectionType, boolean> = {
      publisher: false,
      subscriber: false,
      worker: false,
      cache: false,
    };

    for (const [type, isReady] of this.connectionStatus.entries()) {
      status[type as ConnectionType] = isReady;
    }

    return status;
  }
}

// Singleton instance
let managerInstance: RedisConnectionManager | null = null;

export function getRedisConnectionManager(): RedisConnectionManager {
  if (!managerInstance) {
    managerInstance = new RedisConnectionManager();
  }
  return managerInstance;
}

// Convenience functions for each connection type
export function getPublisherConnection(): IORedis | null {
  return getRedisConnectionManager().getConnection('publisher');
}

export function getSubscriberConnection(): IORedis | null {
  return getRedisConnectionManager().getConnection('subscriber');
}

export function getWorkerConnection(): IORedis | null {
  return getRedisConnectionManager().getConnection('worker');
}

export function getCacheConnection(): IORedis | null {
  return getRedisConnectionManager().getConnection('cache');
}
