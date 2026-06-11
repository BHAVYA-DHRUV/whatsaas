import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats, messages } from '@/lib/db/schema';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { cacheInvalidateTeam } from '@/lib/cache/redis-cache';

export async function DELETE(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    console.log("[CHAT DELETE REQUEST]", payload);
    const { chatIds } = payload;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return NextResponse.json({ error: 'Invalid chat IDs' }, { status: 400 });
    }

    // Fetch details before database operation for logging
    const chatsBeforeDelete = await db
      .select({ id: chats.id, remoteJid: chats.remoteJid, instanceId: chats.instanceId })
      .from(chats)
      .where(and(
        eq(chats.teamId, team.id),
        inArray(chats.id, chatIds)
      ));

    for (const chatInfo of chatsBeforeDelete) {
      console.log("[DELETE CHAT]", {
        chatId: chatInfo.id,
        remoteJid: chatInfo.remoteJid,
        instanceId: chatInfo.instanceId
      });
    }

    // Soft-delete associated messages (preserve history, just mark as deleted)
    await db.update(messages)
      .set({ deletedAt: new Date() })
      .where(and(
        inArray(messages.chatId, chatIds),
        isNull(messages.deletedAt)
      ));

    // Soft-delete the chats
    const deleted = await db.update(chats)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(chats.teamId, team.id),
        inArray(chats.id, chatIds),
        isNull(chats.deletedAt)
      ))
      .returning({ id: chats.id, remoteJid: chats.remoteJid, instanceId: chats.instanceId });

    // Log after database operation
    for (const row of deleted) {
      console.log("[DELETE CHAT]", {
        chatId: row.id,
        remoteJid: row.remoteJid,
        instanceId: row.instanceId
      });
    }

    const result = { success: true, deletedCount: deleted.length };
    console.log("[CHAT DELETE SUCCESS]", result);

    // Invalidate the team's cached chats so the UI updates immediately
    await cacheInvalidateTeam(team.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[DELETE CHAT ERROR]:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}