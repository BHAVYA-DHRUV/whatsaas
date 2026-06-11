import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats, messages, evolutionInstances, type Message } from '@/lib/db/schema';
import { eq, and, or, like } from 'drizzle-orm';
import { formatMessageForFrontend } from '@/lib/db/messages';
import { sendMediaViaProvider } from '@/lib/whatsapp/send-helpers';
import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { cacheInvalidateTeam } from '@/lib/cache/redis-cache';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://localhost:8080";


function getMediaType(mimeType: string): { type: 'image' | 'video' | 'document' | 'audio', subDir: string, preview: string, msgType: Message['messageType'] } {
    if (mimeType === 'image/webp') return { type: 'image', subDir: 'sticker', preview: '💟 Sticker', msgType: 'stickerMessage' };
    if (mimeType.startsWith('image/')) return { type: 'image', subDir: 'image', preview: '📷 Image', msgType: 'imageMessage' };
    if (mimeType.startsWith('video/')) return { type: 'video', subDir: 'video', preview: '📹 Video', msgType: 'videoMessage' };
    if (mimeType.startsWith('audio/')) return { type: 'audio', subDir: 'audio', preview: '🔊 Audio', msgType: 'audioMessage' };
    return { type: 'document', subDir: 'document', preview: '📄 Document', msgType: 'documentMessage' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientJid, fileBase64, mimeType, fileName, quotedMessageData, instanceId } = body;

    if (!recipientJid || !fileBase64 || !mimeType || !fileName) {
      return NextResponse.json({ error: 'recipientJid, fileBase64, mimeType and fileName are required' }, { status: 400 });
    }

    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      return NextResponse.json({ error: 'No connected instance found.' }, { status: 404 });
    }

    const { instanceName, id: dbInstanceId } = activeInstance;
    const accessToken = activeInstance.accessToken || '';
    const { type: mediaType, subDir, preview, msgType } = getMediaType(mimeType);

    let publicMediaUrl: string | null = null;
    try {
        const buffer = Buffer.from(fileBase64, 'base64');
        const uniqueId = uuidv4();
        const safeFileName = `${uniqueId}-${fileName.replace(/[^a-z0-9._-]/gi, '_')}`;

        const relativeDirPath = path.join('uploads', subDir);
        const absoluteDirPath = path.join(process.cwd(), 'public', relativeDirPath);
        const absoluteFilePath = path.join(absoluteDirPath, safeFileName);

        await fs.mkdir(absoluteDirPath, { recursive: true });
        await fs.writeFile(absoluteFilePath, buffer);

        const webPath = relativeDirPath.split(path.sep).join('/');
        publicMediaUrl = `/${webPath}/${safeFileName}`;

    } catch (fileError: any) {
        console.error(`Failed to save file locally: ${fileError.message}`);
    }

    
    if (activeInstance.integration === 'META-CLOUD') {
      const chatForMeta = targetChat || await db.query.chats.findFirst({
        where: and(eq(chats.teamId, team.id), jidCondition),
        columns: { id: true },
      });

      const result = await sendMediaViaProvider({
        instance: {
          id: dbInstanceId, instanceName, accessToken: accessToken || '',
          integration: activeInstance.integration,
          metaToken: activeInstance.metaToken, metaPhoneNumberId: activeInstance.metaPhoneNumberId,
        },
        recipientJid, teamId: team.id, chatId: chatForMeta?.id, instanceId: dbInstanceId,
        mediaBase64: fileBase64, mimetype: mimeType, mediaType: mediaType as any,
        fileName, caption: undefined, localMediaUrl: publicMediaUrl || undefined,
        quotedMessageData: quotedMessageData || null,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to send media' }, { status: 500 });
      }

      return NextResponse.json(formatMessageForFrontend({
        id: result.messageId, chatId: result.chatId, fromMe: true,
        messageType: msgType, text: preview, timestamp: new Date(),
        status: 'sent', isInternal: false, mediaUrl: publicMediaUrl,
        mediaMimetype: mimeType,
      }));
    }

    const evolutionPayload: any = {
      number: recipientJid,
      delay: 1200,
      mediatype: mediaType,
      media: fileBase64,
      mimetype: mimeType,
    };

    if (mediaType === 'document') {
        evolutionPayload.fileName = fileName;
    }

    if (quotedMessageData && quotedMessageData.id) {
        evolutionPayload.quoted = { 
            key: { id: quotedMessageData.id },
            message: quotedMessageData.text ? { conversation: quotedMessageData.text } : undefined
        };
    }

    let evolutionResponse: Response | null = null;
    let evolutionData: any = null;
    let sendFailed = true;
    let errorMsg: string | null = null;

    // Retry sending media up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        evolutionResponse = await fetch(
          `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': accessToken },
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

        errorMsg = evolutionData?.message || evolutionData?.error || 'Failed to send media via Evolution API.';
        console.warn(`[Media Send] Attempt ${attempt} failed for ${instanceName}: ${errorMsg}`);
      } catch (err: any) {
        errorMsg = err.message || 'Network timeout or connection error';
        console.warn(`[Media Send] Attempt ${attempt} error for ${instanceName}: ${errorMsg}`);
      }

      if (attempt < 3) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }

    if (sendFailed) {
      console.error(`Evolution API Error (sendMedia) for ${instanceName}:`, evolutionData);
    }

    const isGroupChat = recipientJid.endsWith('@g.us');
    const messageStatus = sendFailed ? 'error' as const : (isGroupChat ? 'delivered' as const : 'sent' as const);

    let savedMessage: any = null;

    await db.transaction(async (tx) => {
      let finalChatId = targetChat?.id;

      if (finalChatId) {
         await tx.update(chats)
            .set({
                lastMessageText: preview,
                lastMessageTimestamp: new Date(),
                lastMessageFromMe: true,
                unreadCount: 0,
                lastMessageStatus: messageStatus,
                deletedAt: null
            })
            .where(eq(chats.id, finalChatId));
      } else {
         const [newChat] = await tx.insert(chats).values({
             teamId: team.id,
             remoteJid: recipientJid,
             instanceId: dbInstanceId,
             name: recipientJid.split('@')[0],
             lastMessageText: preview,
             lastMessageTimestamp: new Date(),
             lastMessageFromMe: true,
             unreadCount: 0,
             lastMessageStatus: messageStatus
         }).returning({ id: chats.id });
         finalChatId = (newChat as { id: number }).id;
      }

      const messageId = (sendFailed || !evolutionData?.key?.id) ? `error_${Date.now()}` : evolutionData.key.id;
      const mediaMsg = (sendFailed || !evolutionData?.message) ? null : evolutionData.message?.[msgType!];
      const finalMediaUrl = publicMediaUrl || mediaMsg?.url || null;

      const dbQuotedMessageId = quotedMessageData?.id || null;
      const dbQuotedMessageText = quotedMessageData ? JSON.stringify(quotedMessageData) : null;

      const newMessageData = {
        id: messageId,
        chatId: finalChatId,
        fromMe: true,
        messageType: sendFailed ? msgType : msgType,
        text: (mediaType === 'document') ? fileName : null,
        timestamp: new Date(),
        status: messageStatus,
        errorMessage: errorMsg,
        mediaUrl: finalMediaUrl,
        mediaMimetype: mimeType,
        mediaCaption: (sendFailed || !mediaMsg) ? null : (mediaMsg?.caption || null),
        mediaFileLength: (sendFailed || !mediaMsg) ? null : (mediaMsg?.fileLength?.toString() || null),
        mediaSeconds: (sendFailed || !mediaMsg) ? null : (mediaType === 'video' || mediaType === 'audio' ? mediaMsg?.seconds : null),
        mediaIsPtt: mediaType === 'audio' ? true : null,
        contactName: null,
        contactVcard: null,
        locationLatitude: null,
        locationLongitude: null,
        locationName: null,
        locationAddress: null,
        quotedMessageId: dbQuotedMessageId,
        quotedMessageText: dbQuotedMessageText,
        isInternal: false
      };

      const [insertedMessage] = await tx.insert(messages).values(newMessageData as any).onConflictDoNothing().returning();
      savedMessage = insertedMessage || newMessageData;
    });

    await cacheInvalidateTeam(team.id);

    return NextResponse.json(formatMessageForFrontend(savedMessage));

  } catch (error: any) {
    console.error('Error in API /api/messages/sendMedia:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}