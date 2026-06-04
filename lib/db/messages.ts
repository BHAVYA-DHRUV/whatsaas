import { type Message } from './schema';

export type FrontendMessage = Omit<Message, 'timestamp'> & {
  timestamp: string;
};

export function formatMessageForFrontend(dbMessage: Partial<Message>): FrontendMessage {
  const timestamp = dbMessage.timestamp;
  let timestampString = '';

  if (timestamp instanceof Date) {
    timestampString = timestamp.toISOString();
  } else if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    if (!trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.includes('-') && !trimmed.includes('GMT')) {
      const formatted = trimmed.replace(' ', 'T');
      timestampString = formatted.includes('T') ? `${formatted}Z` : `${formatted}T00:00:00Z`;
    } else {
      timestampString = trimmed;
    }
  } else if (typeof timestamp === 'number') {
    const ms = timestamp < 9999999999 ? timestamp * 1000 : timestamp;
    timestampString = new Date(ms).toISOString();
  } else {
    timestampString = new Date().toISOString();
  }

  return {
    id: dbMessage.id || `temp_${Date.now()}`,
    chatId: dbMessage.chatId || 0,
    fromMe: dbMessage.fromMe === true,
    messageType: dbMessage.messageType || 'unknown',
    text: dbMessage.text || null,
    timestamp: timestampString,
    mediaUrl: dbMessage.mediaUrl || null,
    mediaMimetype: dbMessage.mediaMimetype || null,
    mediaCaption: dbMessage.mediaCaption || null,
    mediaFileLength: dbMessage.mediaFileLength || null,
    mediaSeconds: dbMessage.mediaSeconds || null,
    mediaIsPtt: dbMessage.mediaIsPtt || null,
    contactName: dbMessage.contactName || null,
    contactVcard: dbMessage.contactVcard || null,
    locationLatitude: dbMessage.locationLatitude || null,
    locationLongitude: dbMessage.locationLongitude || null,
    locationName: dbMessage.locationName || null,
    locationAddress: dbMessage.locationAddress || null,
    quotedMessageId: dbMessage.quotedMessageId || null,
    quotedMessageText: dbMessage.quotedMessageText || null,
    status: dbMessage.status || 'sent',
    isInternal: dbMessage.isInternal || false,
    isAi: dbMessage.isAi || false,
    isAutomation: dbMessage.isAutomation || false,
    participant: dbMessage.participant || null,
    participantName: dbMessage.participantName || null,
    errorMessage: dbMessage.errorMessage || null,
  };
}