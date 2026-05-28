/** Canonical Pusher / Socket.io event names for team channels `team-{id}`. */
export const RealtimeEvents = {
  NEW_MESSAGE: 'new-message',
  CHAT_LIST_UPDATE: 'chat-list-update',
  MESSAGE_STATUS_UPDATE: 'message-status-update',
  MESSAGE_REACTION: 'message-reaction',
  CHAT_STATUS_UPDATE: 'chat-status-update',
  CONTACT_UPDATE: 'contact-update',
  TYPING: 'typing-indicator',
  ASSIGNMENT_UPDATE: 'assignment-update',
} as const;

export type TypingPayload = {
  chatId: number;
  remoteJid: string;
  userId: number;
  userName: string;
  isTyping: boolean;
};
