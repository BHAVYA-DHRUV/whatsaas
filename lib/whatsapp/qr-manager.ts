import { db } from '@/lib/db/drizzle';
import { evolutionInstances } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { pusherServer } from '@/lib/pusher-server';

export interface QRPayload {
  success: boolean;
  qrCode: string | null;
  base64: string | null;
  qrcode: string | null;
  code: string | null;
  pairingCode: string | null;
  status: string;
}

// In-memory cache fallback for single-node scaling or Redis offline scenarios
const memoryCache = new Map<string, { payload: QRPayload; expiresAt: number }>();

export class QRManager {
  /**
   * Caches a QR payload both in Redis and local memory.
   */
  static async setQR(instanceName: string, payload: QRPayload, ttlSeconds = CacheTTL.qrCode || 120): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    
    // Store in memory cache
    memoryCache.set(instanceName, { payload, expiresAt });
    
    // Store in Redis
    const cacheKey = CacheKeys.qrCode(instanceName);
    await cacheSet(cacheKey, payload, ttlSeconds);
  }

  /**
   * Retrieves a cached QR payload from memory or Redis.
   */
  static async getQR(instanceName: string): Promise<QRPayload | null> {
    // 1. Check Memory Cache first
    const memEntry = memoryCache.get(instanceName);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.payload;
    } else if (memEntry) {
      memoryCache.delete(instanceName); // Clean up expired memory cache
    }

    // 2. Fallback to Redis Cache
    const cacheKey = CacheKeys.qrCode(instanceName);
    const cached = await cacheGet<QRPayload>(cacheKey);
    if (cached) {
      // Re-populate memory cache
      memoryCache.set(instanceName, { 
        payload: cached, 
        expiresAt: Date.now() + 60 * 1000 // default 60s memory lifetime
      });
      return cached;
    }

    return null;
  }

  /**
   * Invalidates a cached QR payload.
   */
  static async invalidateQR(instanceName: string): Promise<void> {
    memoryCache.delete(instanceName);
    const cacheKey = CacheKeys.qrCode(instanceName);
    await cacheDel(cacheKey);
  }

  /**
   * Emits the QR update payload in real-time to connected frontends.
   */
  static async emitQR(teamId: number, instanceName: string, payload: QRPayload): Promise<void> {
    const pusherChannel = `team-${teamId}`;
    
    // Emit QR update event
    await pusherServer.trigger(pusherChannel, 'qr-update-needed', {
      instance: instanceName,
      qrcode: {
        base64: payload.base64 || payload.qrCode || null,
        code: payload.code || null,
        pairingCode: payload.pairingCode || null,
      }
    });

    // Emit connection status update event
    await pusherServer.trigger(pusherChannel, 'connection-status', {
      status: payload.status,
      instance: instanceName
    });
  }

  /**
   * Updates the instance status and timestamps in the PostgreSQL database.
   */
  static async persistStatus(instanceId: number, status: string, additionalFields: Record<string, any> = {}): Promise<void> {
    const fieldsToUpdate: Record<string, any> = {
      status,
      updatedAt: new Date(),
      ...additionalFields
    };

    if (status === 'open') {
      fieldsToUpdate.connectedAt = new Date();
    }

    await db.update(evolutionInstances)
      .set(fieldsToUpdate)
      .where(eq(evolutionInstances.id, instanceId));
  }
}
