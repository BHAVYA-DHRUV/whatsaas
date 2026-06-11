import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissionContext } from '@/lib/auth/permissions-guard';
import { getTeamChatsForInbox } from '@/lib/services/inbox-service';
import { listChatsQuerySchema } from '@/lib/validators/inbox';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { ensureIndexes } from '@/lib/db/setup-indexes';
import { ensureConversationArray } from '@/lib/types/conversation';
import { logInvalidApiResponse, logInvalidCachePayload } from '@/lib/monitoring/inbox-health';

export const dynamic = 'force-dynamic';

// Browser/CDN caching: private (per-user), stale-while-revalidate=15s
// This lets the browser serve a cached response immediately while
// SWR revalidates in the background — eliminates navigation flash.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, stale-while-revalidate=15',
};

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      await ensureIndexes();
      const permCtx = await getUserPermissionContext();
      if (!permCtx) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const parsed = listChatsQuerySchema.safeParse({
        scope: searchParams.get('scope') ?? undefined,
      });

      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
      }

      const scope = parsed.data.scope ?? 'inbox';
      const cacheKey = CacheKeys.teamChats(permCtx.teamId, scope);
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) {
        const validated = ensureConversationArray(cached);
        if (validated.length === 0 && cached !== null && typeof cached === 'object') {
          logInvalidCachePayload(cacheKey, typeof cached, cached, { teamId: permCtx.teamId });
        }
        return NextResponse.json(validated, {
          headers: { ...CACHE_HEADERS, 'X-Cache': 'HIT' },
        });
      }

      const formattedChats = await getTeamChatsForInbox(permCtx, {
        scope: parsed.data.scope,
      });

      if (!Array.isArray(formattedChats)) {
        logInvalidApiResponse('/api/chats', typeof formattedChats, formattedChats, { teamId: permCtx.teamId });
        return NextResponse.json([], { status: 200, headers: CACHE_HEADERS });
      }

      await cacheSet(cacheKey, formattedChats, CacheTTL.chats);

      return NextResponse.json(formattedChats, {
        headers: { ...CACHE_HEADERS, 'X-Cache': 'MISS' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching chats:', message);
      return NextResponse.json([], { status: 200 });
    }
  });
}
