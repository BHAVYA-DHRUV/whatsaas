import 'server-only';

import { getRedis } from '@/lib/redis';

const DEFAULT_TTL_SEC = 60;

export const CacheKeys = {
  teamChats: (teamId: number, scope: string) => `cache:chats:${teamId}:${scope}`,
  dashboardMetrics: (teamId: number) => `cache:dashboard:${teamId}`,
  dashboardBootstrap: (teamId: number) => `cache:bootstrap:${teamId}`,
  unreadTotal: (teamId: number) => `cache:unread:${teamId}`,
  contactsList: (teamId: number) => `cache:contacts:${teamId}`,
  teamInstances: (teamId: number) => `cache:instances:${teamId}`,
  funnelStages: (teamId: number) => `cache:funnel:${teamId}`,
  publishedPlans: () => 'cache:plans:published',
  branding: () => 'cache:branding',
  qrCode: (instanceName: string) => `qr:${instanceName}`,
} as const;

export const CacheTTL = {
  chats: 12,
  dashboard: 30,
  unread: 8,
  contacts: 60,
  plans: 300,
  branding: 600,
  qrCode: 120, // 2 minutes for QR codes
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec = DEFAULT_TTL_SEC): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const payload = JSON.stringify(value);
    await redis.set(key, payload, 'EX', ttlSec);
  } catch {
    /* non-fatal */
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || !keys.length) return;
  try {
    await Promise.all(keys.map((k) => redis.del(k)));
  } catch {
    /* non-fatal */
  }
}

export async function cacheInvalidateTeam(teamId: number): Promise<void> {
  await cacheDel(
    CacheKeys.teamChats(teamId, 'inbox'),
    CacheKeys.teamChats(teamId, 'archived'),
    CacheKeys.teamChats(teamId, 'all'),
    CacheKeys.teamChats(teamId, 'kanban'),
    CacheKeys.dashboardMetrics(teamId),
    CacheKeys.dashboardBootstrap(teamId),
    CacheKeys.unreadTotal(teamId),
    CacheKeys.contactsList(teamId),
    CacheKeys.teamInstances(teamId),
    CacheKeys.funnelStages(teamId)
  );
}

export async function cacheInvalidateInstance(instanceName: string): Promise<void> {
  await cacheDel(CacheKeys.qrCode(instanceName));
}
