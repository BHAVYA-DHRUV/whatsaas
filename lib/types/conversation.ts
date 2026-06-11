/**
 * Strong TypeScript types for Conversation/Chat entities
 * Used across API, cache, socket events, and frontend
 */

export type Agent = {
  id: number;
  name: string;
  email?: string;
  image?: string;
};

export type FunnelStage = {
  id: number;
  name: string;
  color?: string;
};

export type TagData = {
  id: number;
  name?: string;
  label?: string;
  color?: string;
};

export type Contact = {
  id?: number;
  name?: string;
  phone?: string;
  assignedUser?: Agent;
  funnelStage?: FunnelStage;
  tags?: TagData[];
};

/**
 * Canonical Conversation/Chat type
 * All inbox APIs must return Conversation[]
 * All cache entries must store Conversation[]
 * Socket events send partial Conversation objects for updates
 */
export type Conversation = {
  id: number;
  teamId?: number;
  remoteJid: string;
  instanceId?: number;
  name?: string;
  pushName?: string;
  profilePicUrl?: string | null;
  lastMessage?: string;
  lastMessageText?: string | null;
  lastMessageTimestamp?: string | null;
  lastCustomerInteraction?: string | null;
  lastMessageFromMe?: boolean;
  lastMessageStatus?: string | null;
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  pinnedAt?: string | null;
  hasStarred?: boolean;
  hasMedia?: boolean;
  createdAt?: string;
  updatedAt?: string;
  contact?: Contact;
};

/**
 * Runtime validation helper
 * Ensures data is Conversation[] before entering state
 */
export function ensureConversationArray(value: unknown): Conversation[] {
  if (!Array.isArray(value)) {
    console.error(
      '[ensureConversationArray] Invalid conversation payload - expected array, got:',
      typeof value,
      value
    );
    return [];
  }

  // Basic shape validation - ensure each item has required fields
  const valid = value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const conv = item as Record<string, unknown>;
    return typeof conv.id === 'number' && typeof conv.remoteJid === 'string';
  });

  if (!valid) {
    console.error(
      '[ensureConversationArray] Array contains invalid conversation items',
      value
    );
    return [];
  }

  return value as Conversation[];
}

/**
 * Type guard for Conversation
 */
export function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false;
  const conv = value as Record<string, unknown>;
  return typeof conv.id === 'number' && typeof conv.remoteJid === 'string';
}

/**
 * Type guard for Conversation[]
 */
export function isConversationArray(value: unknown): value is Conversation[] {
  if (!Array.isArray(value)) return false;
  return value.every(isConversation);
}
