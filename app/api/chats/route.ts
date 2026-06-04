import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissionContext } from '@/lib/auth/permissions-guard';
import { getTeamChatsForInbox } from '@/lib/services/inbox-service';
import { listChatsQuerySchema } from '@/lib/validators/inbox';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { withRateLimit } from '@/lib/api/with-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
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
      const cached = await cacheGet<unknown[]>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
      }

      const formattedChats = await getTeamChatsForInbox(permCtx, {
        scope: parsed.data.scope,
      });

      await cacheSet(cacheKey, formattedChats, CacheTTL.chats);

      return NextResponse.json(formattedChats, { headers: { 'X-Cache': 'MISS' } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching chats:', message);
      
      // Graceful error handling: return 200 OK with empty array when instance is transitioning
      // This prevents the inbox from throwing 500 errors during connection state changes
      return NextResponse.json(
        { 
          chats: [], 
          message: 'Synchronizing device...' 
        }, 
        { status: 200 }
      );
    }
  });
}
