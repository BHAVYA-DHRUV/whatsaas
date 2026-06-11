export function parseDateSafe(timestamp: string | Date | number | null | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') {
    const ms = timestamp < 9999999999 ? timestamp * 1000 : timestamp;
    return new Date(ms);
  }
  if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    const hasTimezone = trimmed.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed) || /GMT|UTC/i.test(trimmed);
    if (!hasTimezone) {
      const formatted = trimmed.replace(' ', 'T');
      return new Date(formatted.includes('T') ? `${formatted}Z` : `${formatted}T00:00:00Z`);
    }
    return new Date(trimmed);
  }
  return new Date(timestamp);
}

/** Format chat timestamps like WhatsApp Web. */
export function formatChatListTime(timestamp: string | Date | number | null | undefined): string {
  if (!timestamp) return '';
  const date = parseDateSafe(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();

  // Reset time to midnight in local timezone to compare calendar days
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = todayMidnight.getTime() - dateMidnight.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    // Today
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  }

  if (diffDays < 7 && diffDays > 0) {
    // Within week: Monday, Tuesday, etc.
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Older: MM/DD/YYYY (e.g. 05/06/2026)
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/** Live relative timestamp formatting for WhatsApp style inbox. */
export function formatLiveTimestamp(timestamp: string | Date | number | null | undefined): string {
  if (!timestamp) return '';
  const date = parseDateSafe(timestamp);
  const timeMs = date.getTime();
  if (Number.isNaN(timeMs)) return '';

  const now = Date.now();
  const diffSec = Math.floor((now - timeMs) / 1000);

  if (diffSec < 60) {
    return 'Now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    const nowLocalDate = new Date(now).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const localDate = new Date(timeMs).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    if (nowLocalDate === localDate) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    }
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayLocalDate = yesterday.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  const localDate = new Date(timeMs).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
  if (yesterdayLocalDate === localDate) {
    return 'Yesterday';
  }

  // Default: Date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

/** Heuristic online indicator — recent customer activity within 5 minutes. */
export function isContactOnline(lastCustomerInteraction: string | Date | null | undefined): boolean {
  if (!lastCustomerInteraction) return false;
  const ts = typeof lastCustomerInteraction === 'string'
    ? new Date(lastCustomerInteraction).getTime()
    : lastCustomerInteraction.getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < 5 * 60 * 1000;
}

export function getChatDisplayName(chat: {
  name?: string | null;
  pushName?: string | null;
  contact?: { name?: string | null } | null;
  remoteJid: string;
}): string {
  const phone = chat.remoteJid.split('@')[0];
  const contactName = chat.contact?.name;
  
  if (contactName && contactName.trim() !== '' && contactName !== phone && contactName !== `+${phone}`) {
    return contactName;
  }

  if (chat.pushName && chat.pushName.trim() !== '' && chat.pushName !== phone && chat.pushName !== `+${phone}`) {
    return chat.pushName;
  }

  if (chat.name && chat.name.trim() !== '' && chat.name !== phone && chat.name !== `+${phone}`) {
    return chat.name;
  }

  return phone || 'Unknown';
}

export function getChatInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export interface SortableChat {
  id: number;
  isPinned?: boolean;
  pinnedAt?: string | Date | number | null;
  lastMessageTimestamp?: string | Date | number | null;
  [key: string]: any;
}

export const parseTimestampSafe = (ts: any): number => {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const parsed = Date.parse(ts);
  return isNaN(parsed) ? 0 : parsed;
};

export function sortConversationsByLatestActivity<T extends SortableChat>(conversations: T[]): T[] {
  return [...conversations].sort((a, b) => {
    // Pinned chats always appear first, sorted by pinnedAt DESC among themselves
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) {
      const pinA = parseTimestampSafe(a.pinnedAt);
      const pinB = parseTimestampSafe(b.pinnedAt);
      if (pinA !== pinB) return pinB - pinA;
    }
    
    // Priority 1: latest activity timestamp descending
    const ta = parseTimestampSafe(a.lastMessageTimestamp);
    const tb = parseTimestampSafe(b.lastMessageTimestamp);
    if (ta !== tb) return tb - ta;

    // Priority 2: conversation id descending (deterministic fallback)
    return b.id - a.id;
  });
}
