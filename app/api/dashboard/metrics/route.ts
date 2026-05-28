import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { chats } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = CacheKeys.dashboardMetrics(team.id);
    const cached = await cacheGet<{
      chatCount: number;
      unreadTotal: number;
      planName: string | null;
    }>(cacheKey);

    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const [stats] = await db
      .select({
        chatCount: sql<number>`count(*)::int`,
        unreadTotal: sql<number>`coalesce(sum(${chats.unreadCount}), 0)::int`,
      })
      .from(chats)
      .where(eq(chats.teamId, team.id));

    const payload = {
      chatCount: stats?.chatCount ?? 0,
      unreadTotal: stats?.unreadTotal ?? 0,
      planName: team.planName ?? null,
      teamName: team.name,
    };

    await cacheSet(cacheKey, payload, CacheTTL.dashboard);

    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
  });
}
