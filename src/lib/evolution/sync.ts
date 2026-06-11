import { db } from '@/lib/db/drizzle';
import { chats, contacts, messages } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { pusherServer } from '@/lib/pusher-server';
import { EvolutionSDK } from '@/lib/whatsapp/evolution-sdk';
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
    console.error('[SYNC SERVICE] Failed to download profile photo:', url, err.message);
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
  if (jid.includes('@lid')) {
    const [user] = jid.split('@');
    const cleanUser = user.split(':')[0];
    return `${cleanUser}@lid`;
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

/**
 * STEP 1 - AUDIT EVOLUTION CONNECTION
 * Audits connection state, triggers reconnect / restart if not open, and polls until open.
 */
export async function syncInstance(instanceName: string): Promise<boolean> {
  const config = await getEvolutionConfig();
  console.log(`[SYNC SERVICE] Auditing connection for ${instanceName}...`);

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const stateData = await EvolutionSDK.getConnectionState(instanceName);
      const state = stateData?.instance?.state || stateData?.state || null;

      if (state === 'open' || state === 'connected') {
        console.log(`[SYNC SERVICE] Instance ${instanceName} is open and connected.`);
        
        // Broadcast instance update
        const pusherChannel = `team-global`; // fallback room
        await pusherServer.trigger(pusherChannel, 'instance:update', {
          instanceName,
          status: 'open',
        });
        
        return true;
      }

      console.warn(`[SYNC SERVICE] Instance ${instanceName} is in state "${state}". Triggering reconnect (Attempt ${attempt})...`);
      
      // Trigger reconnect
      await fetch(`${config.apiUrl.replace(/\/$/, '')}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': config.apiKey,
        },
      }).catch(() => null);

      // Trigger restart if first reconnect didn't succeed immediately in next attempts
      if (attempt > 2) {
        await fetch(`${config.apiUrl.replace(/\/$/, '')}/instance/restart/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': config.apiKey,
          },
        }).catch(() => null);
      }

    } catch (err: any) {
      console.error(`[SYNC SERVICE] Connection audit failed on attempt ${attempt}:`, err.message);
    }
    
    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return false;
}

/**
 * STEP 3 - FETCH ALL CHATS
 * Fetches chats and stores/upserts them.
 */
export async function syncChats(
  instanceId: number,
  teamId: number,
  instanceName: string,
  token: string
): Promise<any[]> {
  console.log(`[SYNC SERVICE] Syncing chats for instance ${instanceName}...`);
  console.log('[CHAT_SYNC_STARTED] Starting chat synchronization...');
  try {
    const evoChats = await EvolutionSDK.fetchChats(instanceName, token);
    const chatsList = Array.isArray(evoChats) ? evoChats : (evoChats?.records || []);

    const processedChats = [];
    const pusherChannel = `team-${teamId}`;

    for (const chat of chatsList) {
      const jid = chat.remoteJid;
      if (!jid || jid.includes('@lid') || jid.includes('@broadcast') || jid.includes('@newsletter')) continue;
      const isGroup = jid.includes('@g.us');
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

      let localPicUrl: string | null = null;
      if (chat.profilePicUrl) {
        localPicUrl = await downloadProfilePic(chat.profilePicUrl);
      }

      const nameToSave = chat.pushName || chat.name || (isGroup ? chat.remoteJid : chat.remoteJid.split('@')[0]);

      const [dbChat] = await db
        .insert(chats)
        .values({
          teamId,
          instanceId,
          remoteJid: normalizeJid(chat.remoteJid),
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
        .returning();

      if (dbChat.deletedAt) {
        console.log("[CHAT DELETE SYNC SKIPPED]", {
          chatId: dbChat.id,
          remoteJid: chat.remoteJid,
          instanceId
        });
        console.log("[CHAT DELETE SOCKET EVENT BLOCKED]", {
          event: "sync-chat-update",
          chatId: dbChat.id,
          remoteJid: chat.remoteJid
        });
        continue;
      }

      processedChats.push(dbChat);

      // Emit Live updates
      await pusherServer.trigger(pusherChannel, 'conversation:new', {
        id: dbChat.id,
        remoteJid: dbChat.remoteJid,
        name: dbChat.name,
        profilePicUrl: dbChat.profilePicUrl,
        lastMessageText: dbChat.lastMessageText,
        lastMessageTimestamp: dbChat.lastMessageTimestamp?.toISOString(),
        unreadCount: dbChat.unreadCount,
        instanceId,
      });

      await pusherServer.trigger(pusherChannel, 'chat-list-update', {
        id: dbChat.id,
        remoteJid: dbChat.remoteJid,
        name: dbChat.name,
        profilePicUrl: dbChat.profilePicUrl,
        lastMessageText: dbChat.lastMessageText || 'New conversation',
        lastMessageTimestamp: dbChat.lastMessageTimestamp ? dbChat.lastMessageTimestamp.toISOString() : new Date().toISOString(),
        unreadCount: dbChat.unreadCount || 0,
        lastMessageFromMe: dbChat.lastMessageFromMe,
        instanceId,
      });
    }

    console.log('[CHAT_SYNC_COMPLETED] Completed chat synchronization.');
    return processedChats;
  } catch (err: any) {
    console.error(`[SYNC SERVICE] Sync chats failed:`, err.message);
    return [];
  }
}

/**
 * STEP 11 - CONTACT SYNC
 * Syncs contacts from Evolution API and links them to database chats.
 */
export async function syncContacts(
  instanceId: number,
  teamId: number,
  instanceName: string,
  token: string
): Promise<void> {
  console.log(`[SYNC SERVICE] Syncing contacts for instance ${instanceName}...`);
  try {
    const evoContacts = await EvolutionSDK.fetchContacts(instanceName, token);
    const contactsList = Array.isArray(evoContacts) ? evoContacts : (evoContacts?.records || []);

    const dbChats = await db.query.chats.findMany({
      where: and(eq(chats.teamId, teamId), eq(chats.instanceId, instanceId)),
      columns: { id: true, remoteJid: true },
    });

    const chatMap = new Map(dbChats.map((c) => [c.remoteJid, c.id]));

    for (const contact of contactsList) {
      const rawJid = contact.remoteJid || contact.id;
      if (!rawJid || rawJid.includes('@lid') || rawJid.includes('@broadcast') || rawJid.includes('@newsletter')) continue;
      
      const normalized = normalizeJid(rawJid);
      let chatId = chatMap.get(normalized);
      
      if (!chatId) {
        // Chat doesn't exist in local DB yet. Create/upsert it!
        const isGroup = normalized.includes('@g.us');
        const nameToSave = contact.pushName || contact.name || (isGroup ? normalized : normalized.split('@')[0]);
        
        try {
          const [newChat] = await db
            .insert(chats)
            .values({
              teamId,
              instanceId,
              remoteJid: normalized,
              name: nameToSave,
              profilePicUrl: contact.profilePicUrl || contact.imgUrl || null,
              lastMessageText: 'New contact synced',
              lastMessageTimestamp: new Date(),
              unreadCount: 0,
            })
            .onConflictDoUpdate({
              target: [chats.teamId, chats.remoteJid, chats.instanceId],
              set: {
                name: nameToSave,
                profilePicUrl: contact.profilePicUrl || contact.imgUrl || chats.profilePicUrl,
              }
            })
            .returning();
            
          if (newChat) {
            chatId = newChat.id;
            chatMap.set(normalized, chatId);
          }
        } catch (dbErr: any) {
          console.error(`[SYNC SERVICE] Failed to auto-create chat for JID ${normalized}:`, dbErr.message);
        }
      }

      if (!chatId) continue;

      const phone = normalized.split('@')[0];
      const pushName = contact.pushName || null;
      const profilePicture = contact.profilePicUrl || contact.imgUrl || null;
      const about = contact.status || contact.about || null;
      const name = contact.pushName || contact.name || contact.verifiedName || phone;

      await db
        .insert(contacts)
        .values({
          teamId,
          chatId,
          name,
          phone,
          pushName,
          profilePicture,
          bio: about,
          status: contact.status || null,
        })
        .onConflictDoUpdate({
          target: [contacts.chatId],
          set: {
            name,
            phone,
            pushName,
            profilePicture: profilePicture || contacts.profilePicture,
            bio: about || contacts.bio,
            status: contact.status || contacts.status,
            updatedAt: new Date(),
          },
        });
    }
  } catch (err: any) {
    console.error(`[SYNC SERVICE] Sync contacts failed:`, err.message);
  }
}

/**
 * STEP 5 - IMPORT MESSAGE HISTORY
 * Imports recent message history for a JID/Conversation.
 */
export async function syncMessages(
  instanceId: number,
  teamId: number,
  chatId: number,
  remoteJid: string,
  instanceName: string,
  token: string,
  limit = 20
): Promise<void> {
  const config = await getEvolutionConfig();
  const pusherChannel = `team-${teamId}`;

  try {
    console.log(`[MESSAGE_SYNC_STARTED] Syncing messages for JID: ${remoteJid}`);
    const response = await fetch(
      `${config.apiUrl.replace(/\/$/, '')}/chat/findMessages/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiKey,
        },
        body: JSON.stringify({
          where: { key: { remoteJid } },
          limit,
        }),
      }
    );

    if (!response.ok) return;

    const data = await response.json();
    const evoMessages = data.messages?.records || data || [];

    if (!Array.isArray(evoMessages)) return;

    const messagesToInsert = [];
    const isGroup = remoteJid.includes('@g.us');

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

      const status = fromMe ? getStatusFromUpdate(evoMsg.MessageUpdate) : 'delivered';

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
        chatId,
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
        instanceId,
        remoteJid,
      });
    }

    if (messagesToInsert.length > 0) {
      await db.insert(messages).values(messagesToInsert).onConflictDoNothing();
      
      // Emit events for each message
      for (const msg of messagesToInsert) {
        await pusherServer.trigger(pusherChannel, 'new-message', msg);
      }
    }
    console.log(`[MESSAGE_SYNC_COMPLETED] Completed message sync for JID: ${remoteJid}`);
  } catch (err: any) {
    console.error(`[SYNC SERVICE] Sync messages failed for ${remoteJid}:`, err.message);
  }
}

/**
 * Trigger background sync flow.
 */
export async function triggerSync(
  teamId: number,
  instanceId: number,
  instanceName: string,
  token: string
) {
  console.log(`[SYNC SERVICE] Triggering sync flow for ${instanceName}...`);
  
  // 1. Audit Connection first
  const connected = await syncInstance(instanceName, token);
  if (!connected) {
    console.error(`[SYNC SERVICE] Connection audit failed for ${instanceName}. Aborting sync.`);
    return;
  }

  // 2. Sync Chats
  let processedChats = await syncChats(instanceId, teamId, instanceName, token);

  // 3. Sync Contacts
  await syncContacts(instanceId, teamId, instanceName, token);

  // If processedChats is empty (due to empty Message table in Evolution), load the chats we just synced from contacts
  if (processedChats.length === 0) {
    processedChats = await db.query.chats.findMany({
      where: and(
        eq(chats.teamId, teamId),
        eq(chats.instanceId, instanceId),
        isNull(chats.deletedAt)
      ),
      orderBy: (c, { desc }) => [desc(c.lastMessageTimestamp)],
    });
  }

  // 4. Sync Messages for the synced active chats
  const activeChats = processedChats.slice(0, 40); // Sync top 40 chats
  for (const chat of activeChats) {
    await syncMessages(instanceId, teamId, chat.id, chat.remoteJid, instanceName, token, 15);
  }

  console.log(`[SYNC SERVICE] Sync completed for ${instanceName}.`);
  
  // Broadcast complete event
  const pusherChannel = `team-${teamId}`;
  await pusherServer.trigger(pusherChannel, 'sync-completed', {
    instanceId,
    instanceName,
  });
}
