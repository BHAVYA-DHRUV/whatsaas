/** Format chat timestamps like WhatsApp Web. */
export function formatChatListTime(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (date >= startOfYesterday) {
    return 'Yesterday';
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
  
  if (contactName && contactName !== phone && contactName !== `+${phone}`) {
    return contactName;
  }

  const hasReadableName = chat.name && chat.name !== phone && chat.name !== `+${phone}`;
  if (hasReadableName) {
    return chat.name!;
  }

  return (
    chat.pushName ||
    chat.name ||
    chat.contact?.name ||
    phone ||
    'Unknown'
  );
}

export function getChatInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
