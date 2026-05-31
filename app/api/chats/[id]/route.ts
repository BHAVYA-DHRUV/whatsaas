import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher-server';
import { cacheInvalidateTeam } from '@/lib/cache/redis-cache';

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

    const [updated] = await db
      .update(chats)
      .set(updates)
      .where(and(eq(chats.id, chatId), eq(chats.teamId, team.id)))
      .returning({
        id: chats.id,
        isPinned: chats.isPinned,
        isArchived: chats.isArchived,
      });

    if (!updated) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    await cacheInvalidateTeam(team.id);
    await pusherServer.trigger(`team-${team.id}`, 'chat-list-update', {
      id: updated.id,
      isPinned: updated.isPinned,
      isArchived: updated.isArchived,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PATCH /api/chats/[id]]', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
