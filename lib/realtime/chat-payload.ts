/**
 * Canonical payload for the `chat-list-update` Pusher/Redis event.
 *
 * RULES:
 *  - `id` (chatId) is always required.
 *  - `remoteJid` is always required UNLESS the payload is purely a status update
 *    for an existing chat (pin/archive only). In that case the frontend will
 *    look up the chat by id and apply the delta — it will NOT try to create a
 *    new Chat object from the payload.
 *  - No emitter may send an empty `{}` payload.
 *  - If remoteJid cannot be determined the event must be suppressed entirely.
 */
export interface ChatListUpdatePayload {
  /** DB primary key of the chat — always required */
  id: number;
  /** WhatsApp JID e.g. "628123456789@s.whatsapp.net" */
  remoteJid?: string;
  /** Evolution instance DB id */
  instanceId?: number;
  name?: string;
  pushName?: string;
  profilePicUrl?: string | null;
  lastMessageText?: string;
  lastMessageTimestamp?: string;
  lastMessageFromMe?: boolean;
  lastMessageStatus?: string | null;
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

/**
 * Runtime validation helper.
 * Call before every `pusherServer.trigger(channel, 'chat-list-update', payload)`.
 * Returns false (and logs) if the payload is fundamentally invalid.
 */
export function isValidChatListUpdatePayload(
  payload: unknown,
  source: string
): payload is ChatListUpdatePayload {
  if (!payload || typeof payload !== 'object') {
    console.warn(
      `[chat-list-update][${source}] Rejecting event — payload is not an object:`,
      payload
    );
    return false;
  }

  const p = payload as Record<string, unknown>;

  if (typeof p.id !== 'number') {
    console.warn(
      `[chat-list-update][${source}] Rejecting event — missing numeric 'id':`,
      payload
    );
    return false;
  }

  // If we have no remoteJid it is OK only if we have at least isPinned or isArchived
  // (pure delta update for existing chats). Any other fields-only payload is suspicious.
  const hasDelta =
    typeof p.isPinned === 'boolean' ||
    typeof p.isArchived === 'boolean' ||
    typeof p.unreadCount === 'number' ||
    typeof p.lastMessageText === 'string' ||
    typeof p.lastMessageStatus === 'string';

  if (!p.remoteJid && !hasDelta) {
    console.warn(
      `[chat-list-update][${source}] Rejecting event — no remoteJid and no usable delta:`,
      payload
    );
    return false;
  }

  return true;
}
