import { type Message } from './schema';
import { parseDateSafe } from '@/lib/inbox/utils';

export type FrontendMessage = Partial<Omit<Message, 'timestamp'>> & {
  id: string;
  chatId: number;
  timestamp: string;
};

export function formatMessageForFrontend(dbMessage: Partial<Message>): FrontendMessage {
  const timestamp = dbMessage.timestamp;
  let timestampString = '';

  if (timestamp) {
    const date = parseDateSafe(timestamp);
    if (!Number.isNaN(date.getTime())) {
      timestampString = date.toISOString();
    } else {
      timestampString = new Date().toISOString();
    }
  } else {
    timestampString = new Date().toISOString();
  }

  return {
    id: dbMessage.id ?? `temp_${Date.now()}`,
    chatId: dbMessage.chatId ?? 0,
    fromMe: dbMessage.fromMe === true,
    messageType: dbMessage.messageType ?? 'unknown',
    text: dbMessage.text ?? null,
    timestamp: timestampString,
    mediaUrl: dbMessage.mediaUrl ?? null,
    mediaMimetype: dbMessage.mediaMimetype ?? null,
    mediaCaption: dbMessage.mediaCaption ?? null,
    mediaFileLength: dbMessage.mediaFileLength ?? null,
    mediaSeconds: dbMessage.mediaSeconds ?? null,
    mediaIsPtt: dbMessage.mediaIsPtt ?? null,
    contactName: dbMessage.contactName ?? null,
    contactVcard: dbMessage.contactVcard ?? null,
    locationLatitude: dbMessage.locationLatitude ?? null,
    locationLongitude: dbMessage.locationLongitude ?? null,
    locationName: dbMessage.locationName ?? null,
    locationAddress: dbMessage.locationAddress ?? null,
    quotedMessageId: dbMessage.quotedMessageId ?? null,
    quotedMessageText: dbMessage.quotedMessageText ?? null,
    status: dbMessage.status ?? 'sent',
    isInternal: dbMessage.isInternal ?? false,
    isAi: dbMessage.isAi ?? false,
    isAutomation: dbMessage.isAutomation ?? false,
    participant: dbMessage.participant ?? null,
    participantName: dbMessage.participantName ?? null,
    errorMessage: dbMessage.errorMessage ?? null,
    deletedAt: dbMessage.deletedAt ?? null,
    instanceId: dbMessage.instanceId ?? null,
    remoteJid: dbMessage.remoteJid ?? null,
    isStarred: dbMessage.isStarred ?? false,
    isEdited: dbMessage.isEdited ?? false,
  };
}