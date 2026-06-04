import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { chats, contacts, messages, evolutionInstances } from '@/lib/db/schema';
import { eq, and, or, like } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';
import { EvolutionSDK } from '@/lib/whatsapp/evolution-sdk';
import { pusherServer } from '@/lib/pusher-server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  console.log('[NEW CHAT LOG] API called to start new chat');
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { instanceId, phone, message } = body;

    console.log('[NEW CHAT LOG] Parameters received:', { instanceId, phone, messageLength: message?.length });

    if (!instanceId || !phone || !message) {
      return NextResponse.json({ error: 'instanceId, phone, and message are required fields.' }, { status: 400 });
    }

    // 1. Validate instance exists and is connected
    const instance = await db.query.evolutionInstances.findFirst({
      where: and(
        eq(evolutionInstances.id, Number(instanceId)),
        eq(evolutionInstances.teamId, team.id)
      ),
    });

    if (!instance) {
      return NextResponse.json({ error: 'Selected connection not found.' }, { status: 404 });
    }

    let status = instance.status;
    if (status !== 'open') {
      try {
        console.log(`[NEW CHAT LOG] Connection status is '${status}' in DB. Querying live connection status for ${instance.instanceName}...`);
        const stateData = await EvolutionSDK.getConnectionState(instance.instanceName);
        const liveStatus = (stateData as any)?.instance?.state || (stateData as any)?.state || null;
        console.log(`[NEW CHAT LOG] Live connection status for ${instance.instanceName} is:`, liveStatus);
        if (liveStatus === 'open') {
          status = 'open';
          await db.update(evolutionInstances)
            .set({ status: 'open', updatedAt: new Date() })
            .where(eq(evolutionInstances.id, instance.id));
          console.log(`[NEW CHAT LOG] Updated status for instance ${instance.instanceName} to 'open' in database.`);
        }
      } catch (err: any) {
        console.error('[NEW CHAT LOG] Failed to query live connection status:', err.message);
      }
    }

    if (status !== 'open' && status !== 'connecting') {
      return NextResponse.json({ error: 'Selected WhatsApp device is not connected. Connect it first.' }, { status: 400 });
    }

    // 2. Format JID (WhatsApp format: digits only + suffix)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }

    const remoteJid = `${cleanPhone}@s.whatsapp.net`;
    console.log('[NEW CHAT LOG] Formatted JID:', remoteJid);

    // 3. Send message via Evolution API
    let sendResult: any = null;
    try {
      console.log(`[NEW CHAT LOG] Sending first message to ${remoteJid} via instance ${instance.instanceName}...`);
      sendResult = await EvolutionSDK.sendMessage(
        instance.instanceName,
        instance.accessToken || '',
        remoteJid,
        message
      );
      console.log('[NEW CHAT LOG] Evolution sendMessage result:', JSON.stringify(sendResult, null, 2));
    } catch (sendError: any) {
      console.error('[NEW CHAT LOG] Evolution sendMessage failed:', sendError.message);
      return NextResponse.json({ error: `WhatsApp transmission failed: ${sendError.message}` }, { status: 500 });
    }

    // Extract message ID from Evolution SDK response or generate fallback
    const messageId = sendResult?.key?.id || sendResult?.message?.key?.id || `msg-${Date.now()}-${uuidv4()}`;

    // 4. Check existing chat, create if missing
    let jidCondition;
    if (remoteJid.endsWith('@g.us')) {
      jidCondition = eq(chats.remoteJid, remoteJid);
    } else {
      const phone = remoteJid.split('@')[0];
      jidCondition = or(
        eq(chats.remoteJid, remoteJid),
        like(chats.remoteJid, `${phone}@%`)
      );
    }

    let chatRecord = await db.query.chats.findFirst({
      where: and(
        eq(chats.teamId, team.id),
        jidCondition,
        eq(chats.instanceId, instance.id)
      ),
    });

    const now = new Date();

    if (!chatRecord) {
      console.log('[NEW CHAT LOG] Chat does not exist. Inserting new chat row...');
      const [newChat] = await db
        .insert(chats)
        .values({
          teamId: team.id,
          instanceId: instance.id,
          remoteJid,
          name: `+${cleanPhone}`,
          lastMessageText: message,
          lastMessageTimestamp: now,
          lastMessageFromMe: true,
          unreadCount: 0,
          lastMessageStatus: 'sent',
        })
        .returning();
      chatRecord = newChat;

      // Save to contacts
      try {
        await db.insert(contacts).values({
          teamId: team.id,
          chatId: chatRecord.id,
          name: `+${cleanPhone}`,
          phone: cleanPhone,
        }).onConflictDoNothing();
      } catch (cErr: any) {
        console.error('[NEW CHAT LOG] Failed to insert contact:', cErr.message);
      }
    } else {
      console.log('[NEW CHAT LOG] Chat exists. Updating last message...');
      await db
        .update(chats)
        .set({
          lastMessageText: message,
          lastMessageTimestamp: now,
          lastMessageFromMe: true,
          lastMessageStatus: 'sent',
        })
        .where(eq(chats.id, chatRecord.id));
    }

    // 5. Store message in PostgreSQL
    await db
      .insert(messages)
      .values({
        id: messageId,
        chatId: chatRecord.id,
        fromMe: true,
        messageType: 'conversation',
        text: message,
        timestamp: now,
        status: 'sent',
      })
      .onConflictDoNothing();

    // 6. Emit Socket.IO / Pusher events
    const pusherChannel = `team-${team.id}`;
    
    // Broadcast list update
    await pusherServer.trigger(pusherChannel, 'chat-list-update', {
      id: chatRecord.id,
      remoteJid,
      lastMessageText: message,
      lastMessageTimestamp: now.toISOString(),
      lastMessageFromMe: true,
      lastMessageStatus: 'sent',
      instanceId: instance.id,
      name: chatRecord.name || `+${cleanPhone}`,
      profilePicUrl: chatRecord.profilePicUrl || null,
      unreadCount: 0,
    });

    // Broadcast new message
    await pusherServer.trigger(pusherChannel, 'new-message', {
      id: messageId,
      chatId: chatRecord.id,
      fromMe: true,
      messageType: 'conversation',
      text: message,
      timestamp: now.toISOString(),
      status: 'sent',
      remoteJid,
      instance: instance.instanceName,
      instanceId: instance.id,
      lastMessageTextPreview: message,
    });

    console.log('[NEW CHAT LOG] Realtime events broadcast successfully. Chat ID:', chatRecord.id);

    return NextResponse.json({
      success: true,
      chatId: chatRecord.id,
      remoteJid,
    });
  } catch (error: any) {
    console.error('[NEW CHAT LOG] Error starting new chat:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error.', stack: error.stack }, { status: 500 });
  }
}
