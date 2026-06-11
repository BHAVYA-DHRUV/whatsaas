import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { messages, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher-server';
import { isValidChatListUpdatePayload } from '@/lib/realtime/chat-payload';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: { chat: { columns: { teamId: true, id: true, remoteJid: true, instanceId: true } } }
    });

    if (!message || (message as any).chat?.teamId !== team.id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Instead of deleting the record, soft-delete it by setting messageType to 'deleted'
    const [updatedMessage] = await db.update(messages)
      .set({
        messageType: 'deleted',
        text: 'This message was deleted',
        mediaUrl: null,
        mediaMimetype: null,
        mediaCaption: null,
        isStarred: false,
      })
      .where(eq(messages.id, id))
      .returning();

    // Check if this was the latest message in the chat
    const latestMessage = await db.query.messages.findFirst({
      where: eq(messages.chatId, message.chatId),
      orderBy: (messages, { desc }) => [desc(messages.timestamp)],
    });

    const chat = (message as any).chat as { id: number; remoteJid: string; instanceId: number } | null;

    if (latestMessage && latestMessage.id === id && chat) {
      // Yes, this is the last message! Update chats table.
      await db.update(chats)
        .set({ lastMessageText: 'This message was deleted' })
        .where(eq(chats.id, message.chatId));

      // Build a complete chat-list-update payload that always includes remoteJid
      const chatUpdatePayload = {
        id: message.chatId,
        remoteJid: chat.remoteJid,
        instanceId: chat.instanceId,
        lastMessageText: 'This message was deleted',
      };

      if (isValidChatListUpdatePayload(chatUpdatePayload, 'DELETE /api/messages/[id]')) {
        console.log('[SOCKET_EMIT] chat-list-update', 'message DELETE', JSON.stringify(chatUpdatePayload));
        await pusherServer.trigger(`team-${team.id}`, 'chat-list-update', chatUpdatePayload);
      }
    }

    // Trigger realtime update event replacing the bubble on frontend
    await pusherServer.trigger(`team-${team.id}`, 'message-update', {
      messageId: id,
      chatId: message.chatId,
      updates: {
        messageType: 'deleted',
        text: 'This message was deleted',
        mediaUrl: null,
        mediaMimetype: null,
        mediaCaption: null,
        isStarred: false,
      }
    });

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { text, isStarred } = body;

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: { chat: { columns: { teamId: true, id: true, remoteJid: true, instanceId: true } } }
    });

    if (!message || (message as any).chat?.teamId !== team.id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const updates: Partial<{ text: string; isStarred: boolean; isEdited: boolean }> = {};
    if (text !== undefined) {
      updates.text = text;
      updates.isEdited = true;
    }
    if (isStarred !== undefined) {
      updates.isStarred = isStarred;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const [updatedMessage] = await db.update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();

    // Check if this is the latest message in the chat
    const latestMessage = await db.query.messages.findFirst({
      where: eq(messages.chatId, message.chatId),
      orderBy: (messages, { desc }) => [desc(messages.timestamp)],
    });

    const chat = (message as any).chat as { id: number; remoteJid: string; instanceId: number } | null;

    if (latestMessage && latestMessage.id === id && text !== undefined && chat) {
      // Yes, this is the last message! Update chats table lastMessageText.
      await db.update(chats)
        .set({ lastMessageText: text })
        .where(eq(chats.id, message.chatId));

      // Build a complete chat-list-update payload that always includes remoteJid
      const chatUpdatePayload = {
        id: message.chatId,
        remoteJid: chat.remoteJid,
        instanceId: chat.instanceId,
        lastMessageText: text,
      };

      if (isValidChatListUpdatePayload(chatUpdatePayload, 'PATCH /api/messages/[id]')) {
        console.log('[SOCKET_EMIT] chat-list-update', 'message PATCH', JSON.stringify(chatUpdatePayload));
        await pusherServer.trigger(`team-${team.id}`, 'chat-list-update', chatUpdatePayload);
      }
    }

    // Trigger realtime update event
    await pusherServer.trigger(`team-${team.id}`, 'message-update', {
      messageId: id,
      chatId: message.chatId,
      updates: {
        text: updatedMessage.text,
        isStarred: updatedMessage.isStarred,
        isEdited: updatedMessage.isEdited,
      }
    });

    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
