import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats, messages } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { cacheInvalidateTeam } from '@/lib/cache/redis-cache';

export async function DELETE(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatIds } = await request.json();
    console.log('[DELETE CHAT LOG] Attempting to delete chats:', chatIds, 'for team:', team.id);

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return NextResponse.json({ error: 'Invalid chat IDs' }, { status: 400 });
    }

    // Delete associated messages first to clear history locally
    await db.delete(messages)
      .where(inArray(messages.chatId, chatIds));

    // Soft-delete the chats
    const deleted = await db.update(chats)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(chats.teamId, team.id),
        inArray(chats.id, chatIds)
      ))
      .returning({ id: chats.id });

    console.log('[DELETE CHAT LOG] Successfully deleted rows:', deleted);

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'No conversations were deleted. They may belong to a different team or do not exist.' }, { status: 404 });
    }

    // Invalidate the team's cached chats so the UI updates immediately
    await cacheInvalidateTeam(team.id);

    return NextResponse.json({ success: true, deletedCount: deleted.length });
  } catch (error: any) {
    console.error('[DELETE CHAT ERROR]:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}