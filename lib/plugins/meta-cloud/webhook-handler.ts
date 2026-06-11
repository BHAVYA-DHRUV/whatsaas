import 'server-only';

import { db } from '@/lib/db/drizzle';
import { chats, contacts, evolutionInstances, messages } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher-server';
import { isValidChatListUpdatePayload } from '@/lib/realtime/chat-payload';

type MetaEntry = {
  id: string;
  changes?: Array<{
    field?: string;
    value?: {
      metadata?: { phone_number_id?: string; display_phone_number?: string };
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
      }>;
      contacts?: Array<{ profile?: { name?: string }; wa_id: string }>;
    };
  }>;
};

function toJid(waId: string) {
  const digits = waId.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

export async function processMetaWebhook(entries: MetaEntry[]) {
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!phoneNumberId || !value?.messages?.length) continue;

      const instance = await db.query.evolutionInstances.findFirst({
        where: and(
          eq(evolutionInstances.integration, 'WHATSAPP-BUSINESS'),
          eq(evolutionInstances.instanceName, phoneNumberId)
        ),
      });

      if (!instance?.teamId) continue;

      const contactName = value.contacts?.[0]?.profile?.name;

      for (const msg of value.messages) {
        if (msg.type !== 'text' || !msg.text?.body) continue;

        const remoteJid = toJid(msg.from);
        const timestamp = new Date(parseInt(msg.timestamp, 10) * 1000);

        let chat = await db.query.chats.findFirst({
          where: and(eq(chats.teamId, instance.teamId), eq(chats.remoteJid, remoteJid)),
        });

        if (!chat) {
          const [created] = await db
            .insert(chats)
            .values({
              teamId: instance.teamId,
              instanceId: instance.id,
              remoteJid,
              name: contactName || remoteJid,
              pushName: contactName,
            })
            .returning();
          chat = created;
        }

        await db
          .insert(messages)
          .values({
            id: msg.id,
            chatId: chat.id,
            fromMe: false,
            text: msg.text.body,
            messageType: 'conversation',
            timestamp,
            status: 'delivered',
          })
          .onConflictDoNothing();

        await db
          .update(chats)
          .set({
            lastMessageText: msg.text.body,
            lastMessageTimestamp: timestamp,
            lastMessageFromMe: false,
            unreadCount: (chat.unreadCount ?? 0) + 1,
          })
          .where(eq(chats.id, chat.id));

        try {
          await pusherServer.trigger(`team-${instance.teamId}`, 'new-message', {
            chatId: chat.id,
            messageId: msg.id,
          });

          // Build a complete payload — never emit empty {} which crashes the frontend
          const chatListPayload = {
            id: chat.id,
            remoteJid,
            instanceId: instance.id,
            name: chat.name ?? contactName ?? remoteJid,
            pushName: chat.pushName ?? contactName ?? null,
            lastMessageText: msg.text.body,
            lastMessageTimestamp: timestamp.toISOString(),
            lastMessageFromMe: false,
            unreadCount: (chat.unreadCount ?? 0) + 1,
          };

          if (isValidChatListUpdatePayload(chatListPayload, 'meta-cloud/webhook-handler')) {
            console.log('[SOCKET_EMIT] chat-list-update', 'meta-cloud webhook', JSON.stringify(chatListPayload));
            await pusherServer.trigger(`team-${instance.teamId}`, 'chat-list-update', chatListPayload);
          }
        } catch {
          /* non-fatal */
        }

        const existingContact = await db.query.contacts.findFirst({
          where: and(
            eq(contacts.teamId, instance.teamId),
            eq(contacts.chatId, chat.id),
            isNull(contacts.deletedAt)
          ),
        });
        if (!existingContact) {
          await db.insert(contacts).values({
            teamId: instance.teamId,
            chatId: chat.id,
            name: contactName || msg.from,
          });
        } else if (contactName && existingContact.name === msg.from) {
          // Only update if the existing name is just the phone number and we have a real name
          await db.update(contacts)
            .set({ name: contactName, updatedAt: new Date() })
            .where(eq(contacts.id, existingContact.id));
        }
      }
    }
  }
}
