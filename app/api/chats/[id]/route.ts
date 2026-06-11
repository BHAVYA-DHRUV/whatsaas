import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher-server';
import { cacheInvalidateTeam } from '@/lib/cache/redis-cache';
import { isValidChatListUpdatePayload } from '@/lib/realtime/chat-payload';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const chatId = parseInt(id, 10);
    if (Number.isNaN(chatId)) {
      return NextResponse.json({ error: 'Invalid chat id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Partial<{
      isPinned: boolean;
      isArchived: boolean;
      pinnedAt: Date | null;
    }> = {};

    if (typeof body.isPinned === 'boolean') {
      updates.isPinned = body.isPinned;
      updates.pinnedAt = body.isPinned ? new Date() : null;
      if (body.isPinned) updates.isArchived = false;
    }
    if (typeof body.isArchived === 'boolean') {
      updates.isArchived = body.isArchived;
      if (body.isArchived) {
        updates.isPinned = false;
        updates.pinnedAt = null;
      }
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Always return remoteJid and instanceId so the realtime payload is complete
    const [updated] = await db
      .update(chats)
      .set(updates)
      .where(and(eq(chats.id, chatId), eq(chats.teamId, team.id)))
      .returning({
        id: chats.id,
        isPinned: chats.isPinned,
        isArchived: chats.isArchived,
        remoteJid: chats.remoteJid,
        instanceId: chats.instanceId,
      });

    if (!updated) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    await cacheInvalidateTeam(team.id);

    // Build a complete payload so the frontend can reactively move the chat
    // between the main list and the archive list without a full page refresh.
    const realtimePayload = {
      id: updated.id,
      remoteJid: updated.remoteJid,
      instanceId: updated.instanceId,
      isPinned: updated.isPinned,
      isArchived: updated.isArchived,
    };

    if (isValidChatListUpdatePayload(realtimePayload, 'PATCH /api/chats/[id]')) {
      console.log('[SOCKET_EMIT] chat-list-update', 'chat/[id] PATCH', JSON.stringify(realtimePayload));
      await pusherServer.trigger(`team-${team.id}`, 'chat-list-update', realtimePayload);
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PATCH /api/chats/[id]]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
