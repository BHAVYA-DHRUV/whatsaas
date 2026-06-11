import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissionContext } from '@/lib/auth/permissions-guard';
import { getTeamChatsForInbox } from '@/lib/services/inbox-service';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { logInvalidApiResponse } from '@/lib/monitoring/inbox-health';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      const permCtx = await getUserPermissionContext();
      if (!permCtx) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const formattedChats = await getTeamChatsForInbox(permCtx, {
        scope: 'pinned',
      });

      // Validate response
      if (!Array.isArray(formattedChats)) {
        logInvalidApiResponse('/api/chats/pinned', typeof formattedChats, formattedChats, { teamId: permCtx.teamId });
        return NextResponse.json([], { status: 200 });
      }

      return NextResponse.json(formattedChats);
    } catch (error: unknown) {
      console.error('Error fetching pinned chats:', error);
      return NextResponse.json([], { status: 200 });
    }
  });
}
