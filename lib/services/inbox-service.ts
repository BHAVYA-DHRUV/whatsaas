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
  if (!contact) return chat;

  const formattedContact = {
    ...contact,
    tags: contact.contactTags.map((ct) => ct.tag),
  };

  const { contactTags: _removed, ...restContact } = formattedContact;
  return { ...chat, contact: restContact };
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
