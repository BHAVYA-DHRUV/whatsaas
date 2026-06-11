import type { PermissionContext } from '@/lib/auth/permissions-guard';
import {
  getDepartmentIdsForUser,
  listChatsForTeam,
  type ListChatsOptions,
} from '@/lib/repositories/chat-repository';

type ChatWithContact = Awaited<ReturnType<typeof listChatsForTeam>>[number];

function filterChatsByPermissions(
  teamChats: ChatWithContact[],
  permCtx: PermissionContext,
  departmentIds: Set<number>
): ChatWithContact[] {
  if (permCtx.canSeeAllChats) return teamChats;

  if (permCtx.chatVisibility === 'department') {
    return teamChats.filter((chat) => {
      if (!chat.contact) return false;
      if (chat.contact.assignedUser?.id === permCtx.userId) return true;
      if (
        chat.contact.assignedDepartmentId &&
        departmentIds.has(chat.contact.assignedDepartmentId)
      ) {
        return true;
      }
      return false;
    });
  }

  return teamChats.filter((chat) => {
    if (!chat.contact) return false;
    return chat.contact.assignedUser?.id === permCtx.userId;
  });
}

function formatChatRow(chat: ChatWithContact) {
  const contact = chat.contact;
  const formattedContact = contact
    ? (() => {
        const formatted = {
          ...contact,
          tags: contact.contactTags.map((ct: any) => ({
            id: ct.tag.id,
            name: ct.tag.name,
            label: ct.tag.name,
            color: ct.tag.color,
          })),
        };
        const { contactTags: _removed, ...restContact } = formatted;
        return restContact;
      })()
    : undefined;

  return {
    id: chat.id,
    teamId: chat.teamId,
    remoteJid: chat.remoteJid,
    instanceId: chat.instanceId,
    name: chat.name,
    pushName: chat.pushName,
    profilePicUrl: chat.profilePicUrl,
    lastMessage: chat.lastMessageText,
    lastMessageText: chat.lastMessageText,
    lastMessageTimestamp: chat.lastMessageTimestamp
      ? chat.lastMessageTimestamp.toISOString()
      : null,
    lastCustomerInteraction: chat.lastCustomerInteraction
      ? chat.lastCustomerInteraction.toISOString()
      : null,
    lastMessageFromMe: chat.lastMessageFromMe,
    lastMessageStatus: chat.lastMessageStatus,
    unreadCount: chat.unreadCount ?? 0,
    isPinned: chat.isPinned ?? false,
    isArchived: chat.isArchived ?? false,
    pinnedAt: chat.pinnedAt ? chat.pinnedAt.toISOString() : null,
    hasStarred: (chat as any).hasStarred ?? false,
    hasMedia: (chat as any).hasMedia ?? false,
    contact: formattedContact,
  };
}

function getDisplayName(chat: ChatWithContact): string {
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

export async function getTeamChatsForInbox(
  permCtx: PermissionContext,
  options: Pick<ListChatsOptions, 'scope' | 'limit'> = {}
) {
  console.log('[Service] getTeamChatsForInbox - teamId:', permCtx.teamId, 'scope:', options.scope, 'limit:', options.limit);
  const teamChats = await listChatsForTeam({
    teamId: permCtx.teamId,
    scope: options.scope,
    limit: options.limit,
  });
  console.log('[Service] After listChatsForTeam, received chats:', teamChats.length);

  const departmentIds = permCtx.canSeeAllChats
    ? new Set<number>()
    : await getDepartmentIdsForUser(permCtx.userId);

  console.log('[Service] Permission context - canSeeAllChats:', permCtx.canSeeAllChats, 'chatVisibility:', permCtx.chatVisibility, 'userId:', permCtx.userId);
  console.log('[Service] Department IDs for user:', Array.from(departmentIds));

  const filtered = filterChatsByPermissions(teamChats, permCtx, departmentIds);
  console.log('[Service] After permission filtering, chats:', filtered.length);

  const nameMap = new Map<string, typeof filtered[number]>();
  console.log('[Service] Starting deduplication...');
  for (const chat of filtered) {
    const isGroup = chat.remoteJid.endsWith('@g.us');
    const name = getDisplayName(chat);
    const phone = chat.remoteJid.split('@')[0];
    const isRawNumber = name === phone || name === `+${phone}` || /^\+?\d+$/.test(name);
    const key = isGroup ? chat.remoteJid : (isRawNumber ? phone : name);
    
    // Keep the chat with the most recent message
    const existing = nameMap.get(key);
    if (!existing) {
      nameMap.set(key, chat);
    } else {
      // Compare timestamps to keep the most recent
      const existingTime = existing.lastMessageTimestamp?.getTime() || 0;
      const newTime = chat.lastMessageTimestamp?.getTime() || 0;
      if (newTime > existingTime) {
        nameMap.set(key, chat);
      }
    }
  }

  const deduplicated = Array.from(nameMap.values());
  console.log('[Service] After deduplication, chats:', deduplicated.length);
  
  // Sort by lastMessageTimestamp descending (most recent first), then by pinned status
  deduplicated.sort((a, b) => {
    // Pinned chats always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // If both pinned, sort by pinnedAt
    if (a.isPinned && b.isPinned) {
      const aPinnedAt = a.pinnedAt?.getTime() || 0;
      const bPinnedAt = b.pinnedAt?.getTime() || 0;
      if (aPinnedAt !== bPinnedAt) {
        return bPinnedAt - aPinnedAt; // More recent pinned first
      }
    }
    
    // Sort by lastMessageTimestamp (most recent first)
    const aTime = a.lastMessageTimestamp?.getTime() || 0;
    const bTime = b.lastMessageTimestamp?.getTime() || 0;
    return bTime - aTime;
  });
  
  console.log('[Service] After sorting, chats:', deduplicated.length);
  const formatted = deduplicated.map(formatChatRow);
  console.log('[Service] After formatChatRow, returning chats:', formatted.length);
  console.log('[Service] Sample formatted chat:', formatted[0] ? { id: formatted[0].id, remoteJid: formatted[0].remoteJid, isArchived: formatted[0].isArchived } : 'No chats');
  return formatted;
}
