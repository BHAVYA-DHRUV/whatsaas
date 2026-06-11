import { db } from '../db/drizzle';
import { chats, contacts, messages } from '../db/schema';
import { getEvolutionConfig } from './config';
import { pusherServer } from '../pusher-server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';

async function downloadProfilePic(url: string): Promise<string | null> {
  if (!url || url.startsWith('/uploads/')) return url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) return null;

    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `${Date.now()}-${uuidv4()}.${ext}`;
    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'avatar');
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, filename), buffer);
    return `/uploads/avatar/${filename}`;
  } catch (err: any) {
    console.error('[SYNC] Failed to download profile photo:', url, err.message);
    return null;
  }
}

function normalizeJid(jid: string): string {
  if (!jid) return '';
  if (jid.includes('@g.us')) return jid;
  if (jid.includes('@s.whatsapp.net')) {
    const [user] = jid.split('@');
    const cleanUser = user.split(':')[0];
    return `${cleanUser}@s.whatsapp.net`;
  }
  return jid;
}

function extractMessageText(msg: any): string | null {
  if (!msg) return null;
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.documentMessage?.fileName ||
    msg.contactMessage?.displayName ||
    msg.locationMessage?.name ||
    msg.locationMessage?.address ||
    null
  );
}

function getMessageType(evoMsg: any): string {
  return evoMsg.messageType || 'conversation';
}

function getStatusFromUpdate(updates: any[]): string {
  if (!updates || updates.length === 0) return 'delivered';
  const last = updates[updates.length - 1];
  const status = last.status;
  if (status === 'READ' || status === 'PLAYED') return 'read';
  if (status === 'DELIVERY_ACK') return 'delivered';
  if (status === 'SERVER_ACK') return 'sent';
  return 'delivered';
}

export async function triggerBackgroundSync(
  teamId: number,
  instanceId: number,
  instanceName: string
) {
  // Fire-and-forget sync wrapper
  console.log(`[SYNC LOG] Launching background sync for team ${teamId}, instance ${instanceName}...`);
  void runSync(teamId, instanceId, instanceName)
    .then(() => {
      console.log(`[SYNC LOG] Background sync finished successfully for instance ${instanceName}`);
    })
    .catch((err) => {
      console.error(`[SYNC LOG] Background sync failed for instance ${instanceName}:`, err);
    });
}

async function runSync(teamId: number, instanceId: number, instanceName: string) {
  const evoConfig = await getEvolutionConfig();
  if (!evoConfig.apiKey || !evoConfig.apiUrl) {
    throw new Error('Evolution API is not properly configured.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': evoConfig.apiKey,
  };

  console.log(`[SYNC LOG] Fetching chats and contacts from Evolution API for ${instanceName}...`);

  // 1. Fetch chats and contacts in parallel
  const [chatsResponse, contactsResponse] = await Promise.all([
    fetch(`${evoConfig.apiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers,
    }).then(res => res.ok ? res.json() : []).catch(() => []),
    fetch(`${evoConfig.apiUrl}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers,
    }).then(res => res.ok ? res.json() : []).catch(() => []),
  ]);

  console.log(`[SYNC LOG] Fetched ${chatsResponse.length} chats and ${contactsResponse.length} contacts.`);

  const contactNameMap = new Map<string, string>();
  if (Array.isArray(contactsResponse)) {
    for (const contact of contactsResponse) {
      const jid = contact.remoteJid || contact.id;
      if (!jid) continue;
      const name = contact.pushName || contact.name || contact.verifiedName;
      if (name) {
        contactNameMap.set(normalizeJid(jid), name);
      }
    }
  }

  // Ensure chatsResponse is an array
  const evoChats = Array.isArray(chatsResponse) ? chatsResponse : [];

  // Filter valid chats to process
  const validEvoChats = evoChats.filter((chat: any) => {
    const jid = chat.remoteJid;
    if (!jid) return false;
    if (jid.includes('@lid')) return false;
    if (jid.includes('@broadcast')) return false;
    if (jid.includes('@newsletter')) return false;
    return jid.includes('@s.whatsapp.net') || jid.includes('@g.us');
  });

  // Limit background sync to most recent 40 chats to prevent timeouts/limits
  const activeChats = validEvoChats.slice(0, 40);
  console.log(`[SYNC LOG] Processing ${activeChats.length} active chats...`);

  const pusherChannel = `team-${teamId}`;

  for (const chat of activeChats) {
    try {
      const isGroup = chat.remoteJid.includes('@g.us');
      const lastMsg = chat.lastMessage;
      let lastMessageText = null;
      let lastMessageTimestamp = null;
      let lastMessageFromMe = null;

      if (lastMsg) {
        lastMessageFromMe = lastMsg.key?.fromMe || false;
        lastMessageTimestamp = lastMsg.messageTimestamp
          ? new Date(lastMsg.messageTimestamp * 1000)
          : null;

        const msg = lastMsg.message;
        if (msg) {
          lastMessageText = extractMessageText(msg);
        }
      }

      // Download and save profile picture url
      let localPicUrl: string | null = null;
      if (chat.profilePicUrl) {
        localPicUrl = await downloadProfilePic(chat.profilePicUrl);
      }

      const nameToSave = chat.pushName || chat.name || contactNameMap.get(normalizeJid(chat.remoteJid)) || (isGroup ? chat.remoteJid : chat.remoteJid.split('@')[0]);

      // 2. Insert or update chat in DB
      const [insertedChat] = await db
        .insert(chats)
        .values({
          teamId,
          instanceId,
          remoteJid: chat.remoteJid,
          name: nameToSave,
          profilePicUrl: localPicUrl,
          lastMessageText,
          lastMessageTimestamp,
          lastMessageFromMe,
          unreadCount: chat.unreadCount || 0,
          lastMessageStatus: lastMessageFromMe ? 'delivered' : null,
        })
        .onConflictDoUpdate({
          target: [chats.teamId, chats.remoteJid, chats.instanceId],
          set: {
            name: nameToSave,
            profilePicUrl: localPicUrl || chats.profilePicUrl,
            lastMessageText: lastMessageText || chats.lastMessageText,
            lastMessageTimestamp: lastMessageTimestamp || chats.lastMessageTimestamp,
            lastMessageFromMe: lastMessageFromMe ?? chats.lastMessageFromMe,
            unreadCount: chat.unreadCount ?? chats.unreadCount,
          },
        })
        .returning({ id: chats.id });

      // 3. Save contact if it's a direct chat
      if (insertedChat && !isGroup) {
        try {
          await db
            .insert(contacts)
            .values({
              teamId,
              chatId: insertedChat.id,
              name: nameToSave,
            })
            .onConflictDoUpdate({
              target: [contacts.chatId],
              set: {
                name: nameToSave,
              },
            });
        } catch (cErr: any) {
          console.error(`[SYNC LOG] Failed to save contact for ${chat.remoteJid}:`, cErr.message);
        }
      }

      // 4. Fetch and insert messages for this chat (limit 15)
      if (insertedChat) {
        try {
          const msgResponse = await fetch(`${evoConfig.apiUrl}/chat/findMessages/${instanceName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              where: { key: { remoteJid: chat.remoteJid } },
              limit: 15,
            }),
          });

          if (msgResponse.ok) {
            const data = await msgResponse.json();
            const evoMessages = data.messages?.records || data || [];

            if (Array.isArray(evoMessages)) {
              const messagesToInsert = [];
              for (const evoMsg of evoMessages) {
                const messageId = evoMsg.key?.id;
                if (!messageId) continue;

                const msgType = getMessageType(evoMsg);
                if (['protocolMessage', 'reactionMessage', 'senderKeyDistributionMessage'].includes(msgType)) {
                  continue;
                }

                const fromMe = evoMsg.key?.fromMe || false;
                const text = extractMessageText(evoMsg.message);
                const timestamp = evoMsg.messageTimestamp
                  ? new Date(evoMsg.messageTimestamp * 1000)
                  : new Date();

                const status = fromMe
                  ? getStatusFromUpdate(evoMsg.MessageUpdate)
                  : 'delivered';

                let participant = null;
                let participantName = null;
                if (isGroup && !fromMe) {
                  const participantJid = evoMsg.key?.participant || evoMsg.key?.participantAlt;
                  if (participantJid && participantJid.includes('@s.whatsapp.net')) {
                    participant = normalizeJid(participantJid);
                  }
                  participantName = evoMsg.pushName || null;
                }

                const msg = evoMsg.message || {};
                let mediaMimetype = null;
                let mediaCaption = null;
                let mediaSeconds = null;
                let mediaIsPtt = null;

                if (msg.imageMessage) {
                  mediaMimetype = msg.imageMessage.mimetype || 'image/jpeg';
                  mediaCaption = msg.imageMessage.caption || null;
                } else if (msg.videoMessage) {
                  mediaMimetype = msg.videoMessage.mimetype || 'video/mp4';
                  mediaCaption = msg.videoMessage.caption || null;
                  mediaSeconds = msg.videoMessage.seconds || null;
                } else if (msg.audioMessage) {
                  mediaMimetype = msg.audioMessage.mimetype || 'audio/ogg';
                  mediaSeconds = msg.audioMessage.seconds || null;
                  mediaIsPtt = msg.audioMessage.ptt || false;
                } else if (msg.documentMessage) {
                  mediaMimetype = msg.documentMessage.mimetype || 'application/octet-stream';
                  mediaCaption = msg.documentMessage.fileName || null;
                }

                messagesToInsert.push({
                  id: messageId,
                  chatId: insertedChat.id,
                  fromMe,
                  messageType: msgType,
                  text: text || (mediaMimetype ? null : 'Message'),
                  timestamp,
                  status,
                  mediaUrl: null,
                  mediaMimetype,
                  mediaCaption,
                  mediaFileLength: null,
                  mediaSeconds,
                  mediaIsPtt,
                  contactName: msg.contactMessage?.displayName || null,
                  contactVcard: msg.contactMessage?.vcard || null,
                  locationLatitude: msg.locationMessage?.degreesLatitude?.toString() || null,
                  locationLongitude: msg.locationMessage?.degreesLongitude?.toString() || null,
                  locationName: msg.locationMessage?.name || null,
                  locationAddress: msg.locationMessage?.address || null,
                  quotedMessageId: msg.extendedTextMessage?.contextInfo?.stanzaId || null,
                  quotedMessageText: null,
                  participant,
                  participantName,
                  isInternal: false,
                });
              }

              if (messagesToInsert.length > 0) {
                await db.insert(messages).values(messagesToInsert).onConflictDoNothing();
              }
            }
          }
        } catch (msgErr: any) {
          console.error(`[SYNC LOG] Failed to sync messages for chat ${chat.remoteJid}:`, msgErr.message);
        }
      }

      // 5. Emit event to update frontend chat-list in real time
      await pusherServer.trigger(pusherChannel, 'chat-list-update', {
        id: insertedChat.id,
        lastMessageStatus: lastMessageFromMe ? 'delivered' : null,
        lastMessageFromMe,
        unreadCount: chat.unreadCount || 0,
        remoteJid: chat.remoteJid,
        lastMessageText: lastMessageText || 'New conversation',
        lastMessageTimestamp: lastMessageTimestamp ? lastMessageTimestamp.toISOString() : new Date().toISOString(),
        instanceId,
        name: nameToSave,
        profilePicUrl: localPicUrl,
      });

    } catch (chatErr: any) {
      console.error(`[SYNC LOG] Error syncing chat ${chat?.remoteJid}:`, chatErr.message);
    }
  }

  console.log(`[SYNC LOG] Broadcast final sync status updates...`);
  // Trigger final channel event indicating sync completion so UI knows to reload details if needed
  await pusherServer.trigger(pusherChannel, 'sync-completed', {
    instanceId,
    instanceName,
  });
}
