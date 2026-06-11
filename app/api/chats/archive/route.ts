import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissionContext } from '@/lib/auth/permissions-guard';
import { getTeamChatsForInbox } from '@/lib/services/inbox-service';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { ensureConversationArray } from '@/lib/types/conversation';
import { logInvalidApiResponse } from '@/lib/monitoring/inbox-health';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, stale-while-revalidate=15',
};

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      const permCtx = await getUserPermissionContext();
      if (!permCtx) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check Redis cache first
      const cacheKey = CacheKeys.teamChats(permCtx.teamId, 'archived');
      const cached = await cacheGet<unknown>(cacheKey);
      if (cached) {
        const validated = ensureConversationArray(cached);
        return NextResponse.json(validated, {
          headers: { ...CACHE_HEADERS, 'X-Cache': 'HIT' },
        });
      }

      const formattedChats = await getTeamChatsForInbox(permCtx, {
        scope: 'archived',
      });

      if (!Array.isArray(formattedChats)) {
        logInvalidApiResponse('/api/chats/archive', typeof formattedChats, formattedChats, { teamId: permCtx.teamId });
        return NextResponse.json([], { status: 200, headers: CACHE_HEADERS });
      }

      await cacheSet(cacheKey, formattedChats, CacheTTL.chats);

      return NextResponse.json(formattedChats, {
        headers: { ...CACHE_HEADERS, 'X-Cache': 'MISS' },
      });
    } catch (error: unknown) {
      console.error('Error fetching archived chats:', error);
      return NextResponse.json([], { status: 200 });
    }
  });
}
