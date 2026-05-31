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
          tags: contact.contactTags.map((ct) => ({
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
  return filtered.map(formatChatRow);
}
