import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { chats, messages, evolutionInstances } from '@/lib/db/schema';
import { eq, and, or, like } from 'drizzle-orm';
import { formatMessageForFrontend } from '@/lib/db/messages';
import { sendTextViaProvider } from '@/lib/whatsapp/send-helpers';
import { cacheInvalidateTeam } from '@/lib/cache/redis-cache';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientJid, text, quotedMessageData, isInternal, instanceId } = body;

    if (!recipientJid || !text) {
      return NextResponse.json({ error: 'recipientJid and text are required' }, { status: 400 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let jidCondition;
    if (recipientJid.endsWith('@g.us')) {
      jidCondition = eq(chats.remoteJid, recipientJid);
    } else {
      const phone = recipientJid.split('@')[0];
      jidCondition = or(
        eq(chats.remoteJid, recipientJid),
        like(chats.remoteJid, `${phone}@%`)
      );
    }

    if (isInternal) {
      let chatConditions = [
        eq(chats.teamId, team.id),
        jidCondition
      ];

      if (instanceId) {
        chatConditions.push(eq(chats.instanceId, Number(instanceId)));
      }

      const chat = await db.query.chats.findFirst({
        where: and(...chatConditions),
        columns: { id: true }
      });

      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }

      const internalId = `internal_${Date.now()}`;
      
      const internalMessageData = {
        id: internalId,
        chatId: chat.id,
        fromMe: true,
        messageType: 'conversation',
        text: text,
        timestamp: new Date(),
        status: 'read' as const,
        isInternal: true,
        mediaUrl: null,
        mediaMimetype: null,
        mediaCaption: null,
        mediaFileLength: null,
        mediaSeconds: null,
        mediaIsPtt: null,
        quotedMessageId: null,
        quotedMessageText: null,
        contactName: null,
        contactVcard: null,
        locationLatitude: null,
        locationLongitude: null,
        locationName: null,
        locationAddress: null
      };

      await db.insert(messages).values(internalMessageData);

      return NextResponse.json(formatMessageForFrontend(internalMessageData));
    }

    let activeInstance = null;
    let targetChat = null;

    if (instanceId) {
        activeInstance = await db.query.evolutionInstances.findFirst({
            where: and(eq(evolutionInstances.id, Number(instanceId)), eq(evolutionInstances.teamId, team.id))
        });

        if (activeInstance) {
            targetChat = await db.query.chats.findFirst({
                where: and(
                    eq(chats.teamId, team.id),
                    jidCondition,
                    eq(chats.instanceId, activeInstance.id)
                )
            });
        }
    }

    if (!activeInstance) {
        targetChat = await db.query.chats.findFirst({
            where: and(
                eq(chats.teamId, team.id),
                jidCondition
            ),
            with: {
                instance: true
            }
        });

        if (targetChat && targetChat.instance) {
            activeInstance = targetChat.instance;
        }
    }
    if (!activeInstance) {
        activeInstance = await db.query.evolutionInstances.findFirst({
            where: eq(evolutionInstances.teamId, team.id)
        });
    }

    if (!activeInstance || !activeInstance.instanceName) {
      return NextResponse.json({ error: 'Nenhuma instância conectada encontrada para enviar a mensagem.' }, { status: 404 });
    }

    const { instanceName, id: dbInstanceId } = activeInstance;
    const accessToken = activeInstance.accessToken || '';

    const currentUser = await getUser();
    let finalText = text;
    if (currentUser?.enableSignature && currentUser?.name) {
      finalText = `*${currentUser.name}:*\n${text}`;
    }

    if (activeInstance.integration === 'META-CLOUD') {
      const chatForMeta = targetChat || await db.query.chats.findFirst({
        where: and(eq(chats.teamId, team.id), jidCondition),
        columns: { id: true },
      });

      const result = await sendTextViaProvider({
        instance: {
          id: dbInstanceId,
          instanceName,
          accessToken: accessToken || '',
          integration: activeInstance.integration,
          metaToken: activeInstance.metaToken,
          metaPhoneNumberId: activeInstance.metaPhoneNumberId,
        },
        recipientJid,
        text: finalText,
        teamId: team.id,
        chatId: chatForMeta?.id,
        instanceId: dbInstanceId,
        quotedMessageData: quotedMessageData || null,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to send' }, { status: 500 });
      }

      return NextResponse.json(formatMessageForFrontend({
        id: result.messageId,
        chatId: result.chatId,
        fromMe: true,
        messageType: 'conversation',
        text: finalText,
        timestamp: new Date(),
        status: 'sent',
        isInternal: false,
      }));
    }

    const evolutionPayload: any = {
      number: recipientJid,
      text: finalText,
    };

    if (quotedMessageData) {
      evolutionPayload.quoted = {
        key: { id: quotedMessageData.id },
        message: quotedMessageData.text ? { conversation: quotedMessageData.text } : undefined
      };
    }

    let evolutionResponse: Response | null = null;
    let evolutionData: any = null;
    let sendFailed = true;
    let errorMsg: string | null = null;

    // Retry sending to Evolution API up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        evolutionResponse = await fetch(
          `${EVOLUTION_API_URL}/message/sendText/${instanceName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': accessToken,
            },
            body: JSON.stringify(evolutionPayload),
            signal: AbortSignal.timeout(10000),
          }
        );

        const responseText = await evolutionResponse.text();
        try {
          evolutionData = JSON.parse(responseText);
        } catch {
          evolutionData = { error: responseText || 'Unknown response format' };
        }

        if (evolutionResponse.ok && evolutionData && !evolutionData.error && evolutionData.status !== 'ERROR' && evolutionData.key?.id) {
          sendFailed = false;
          break;
        }

        errorMsg = evolutionData?.message || evolutionData?.error || 'Failed to send message via Evolution API.';
        console.warn(`[Message Send] Attempt ${attempt} failed for ${instanceName}: ${errorMsg}`);
      } catch (err: any) {
        errorMsg = err.message || 'Network timeout or connection error';
        console.warn(`[Message Send] Attempt ${attempt} error for ${instanceName}: ${errorMsg}`);
      }

      if (attempt < 3) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }

    if (sendFailed) {
      console.error(`Evolution API Error for ${instanceName}:`, evolutionData);
    }

    const isGroupChat = recipientJid.endsWith('@g.us');
    const messageStatus = sendFailed ? 'error' as const : (isGroupChat ? 'delivered' as const : 'sent' as const);

    let savedMessage: any = null;
    await db.transaction(async (tx) => {
      let finalChatId = targetChat?.id;

      if (!finalChatId) {
         const [newChat] = await tx.insert(chats).values({
             teamId: team.id,
             remoteJid: recipientJid,
             instanceId: dbInstanceId,
             name: recipientJid.split('@')[0],
             lastMessageText: text,
             lastMessageTimestamp: new Date(),
             lastMessageFromMe: true,
             unreadCount: 0,
             lastMessageStatus: messageStatus
         }).returning({ id: chats.id });

         finalChatId = newChat.id;
      } else {
         await tx.update(chats)
            .set({
              lastMessageText: text,
              lastMessageTimestamp: new Date(),
              lastMessageFromMe: true,
              unreadCount: 0,
              lastMessageStatus: messageStatus,
              deletedAt: null
            })
            .where(eq(chats.id, finalChatId));
      }

      const messageId = (sendFailed || !evolutionData?.key?.id) ? `error_${Date.now()}` : evolutionData.key.id;
      const messageContent = (sendFailed || !evolutionData?.message) ? null : (evolutionData.message?.extendedTextMessage || evolutionData.message);
      const messageText = (sendFailed || !evolutionData?.message) ? text : (messageContent?.text || evolutionData.message?.conversation || text);

      const dbQuotedMessageId = quotedMessageData?.id || null;
      const dbQuotedMessageText = quotedMessageData ? JSON.stringify(quotedMessageData) : null;

      const newMessageData = {
        id: messageId,
        chatId: finalChatId,
        fromMe: true,
        messageType: (sendFailed || !evolutionData) ? 'conversation' : (evolutionData.messageType || (messageContent?.text ? 'extendedTextMessage' : 'conversation')),
        text: messageText,
        timestamp: new Date(),
        status: messageStatus,
        errorMessage: errorMsg,
        mediaUrl: null,
        mediaMimetype: null,
        mediaCaption: null,
        mediaFileLength: null,
        mediaSeconds: null,
        mediaIsPtt: null,
        contactName: null,
        contactVcard: null,
        locationLatitude: null,
        locationLongitude: null,
        locationName: null,
        locationAddress: null,
        quotedMessageId: dbQuotedMessageId,
        quotedMessageText: dbQuotedMessageText,
        isInternal: false,
        instanceId: dbInstanceId,
        remoteJid: recipientJid,
      };

      const [insertedMessage] = await tx.insert(messages).values(newMessageData).onConflictDoNothing().returning();
      savedMessage = insertedMessage || newMessageData;
    });

    await cacheInvalidateTeam(team.id);

    return NextResponse.json(formatMessageForFrontend(savedMessage || {}));

  } catch (error: any) {
    console.error('Error in /api/messages/send API:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}