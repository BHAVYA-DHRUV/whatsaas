export type Reaction = {
  id: number;
  emoji: string;
  fromMe: boolean;
  remoteJid: string | null;
  participantName: string | null;
};

export type Message = {
  id: string;
  chatId: number;
  fromMe: boolean;
  messageType: string | null;
  text: string | null;
  timestamp: string;
  mediaUrl?: string | null;
  mediaMimetype?: string | null;
  mediaCaption?: string | null;
  status?: string | null;
  quotedMessageId?: string | null;
  quotedMessageText?: string | null;
  isAi?: boolean;
  isAutomation?: boolean;
  isInternal?: boolean;
  reactions?: Reaction[];
  errorMessage?: string;
  participantName?: string | null;
};

export type QuickReply = {
  id: number;
  shortcut: string;
  message: string;
};

export type NewMessagePayload = Message & {
  remoteJid?: string;
  instanceId?: number;
};

export type ChatDetails = {
  remoteJid: string | null;
  name: string;
  profilePicUrl: string | null;
  lastCustomerInteraction: string | null;
  integration: string;
  phone?: string | null;
};

export type ContactData = {
  id: number;
  name?: string;
  phone?: string;
  notes?: string;
  funnelStageId?: number;
};

export type TeamData = { id: number; name?: string };
export type UserData = { id: number; email: string; name?: string };
export type RecordingStatus = 'idle' | 'recording' | 'recorded' | 'review' | 'sending';
