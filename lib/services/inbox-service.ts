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
    contact: formattedContact,
  };
}

function getDisplayName(chat: ChatWithContact): string {
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

export async function getTeamChatsForInbox(
  permCtx: PermissionContext,
  options: Pick<ListChatsOptions, 'scope' | 'limit'> = {}
) {
  const teamChats = await listChatsForTeam({
    teamId: permCtx.teamId,
    scope: options.scope,
    limit: options.limit,
  });

  const departmentIds = permCtx.canSeeAllChats
    ? new Set<number>()
    : await getDepartmentIdsForUser(permCtx.userId);

  const filtered = filterChatsByPermissions(teamChats, permCtx, departmentIds);

  const nameMap = new Map<string, typeof filtered[number]>();
  const deduplicated: typeof filtered = [];
  for (const chat of filtered) {
    const isGroup = chat.remoteJid.endsWith('@g.us');
    const name = getDisplayName(chat);
    const phone = chat.remoteJid.split('@')[0];
    const isRawNumber = name === phone || name === `+${phone}` || /^\+?\d+$/.test(name);
    const key = isGroup ? chat.remoteJid : (isRawNumber ? phone : name);
    
    if (!nameMap.has(key)) {
      nameMap.set(key, chat);
      deduplicated.push(chat);
    }
  }

  return deduplicated.map(formatChatRow);
}
