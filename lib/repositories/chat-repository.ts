import { db } from '@/lib/db/drizzle';
import {
  chats,
  contacts,
  funnelStages,
  users,
  departments,
  contactTags,
  tags,
  departmentMembers
} from '@/lib/db/schema';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

export type ListChatsOptions = {
  teamId: number;
  scope?: 'kanban' | 'archived';
  limit?: number;
};

export async function listChatsForTeam({ teamId, scope, limit }: ListChatsOptions) {
  const resolvedLimit = limit ?? (scope === 'kanban' ? 500 : 200);
  const whereConditions = [eq(chats.teamId, teamId), isNull(chats.deletedAt)];

  if (scope === 'archived') {
    whereConditions.push(eq(chats.isArchived, true));
  } else {
    whereConditions.push(eq(chats.isArchived, false));
    if (scope !== 'kanban') {
      whereConditions.push(isNotNull(chats.lastMessageTimestamp));
    }
  }

  // Use raw SQL joins to query all chat details in a single DB roundtrip
  const rows = await db
    .select({
      chat: {
        id: chats.id,
        teamId: chats.teamId,
        remoteJid: chats.remoteJid,
        instanceId: chats.instanceId,
        name: chats.name,
        pushName: chats.pushName,
        profilePicUrl: chats.profilePicUrl,
        lastMessageText: chats.lastMessageText,
        lastMessageTimestamp: chats.lastMessageTimestamp,
        lastCustomerInteraction: chats.lastCustomerInteraction,
        lastMessageFromMe: chats.lastMessageFromMe,
        lastMessageStatus: chats.lastMessageStatus,
        unreadCount: chats.unreadCount,
        isPinned: chats.isPinned,
        pinnedAt: chats.pinnedAt,
        isArchived: chats.isArchived,
      },
      contact: {
        id: contacts.id,
        name: contacts.name,
        notes: contacts.notes,
        showTimeInStage: contacts.showTimeInStage,
        assignedDepartmentId: contacts.assignedDepartmentId,
        assignedUserId: contacts.assignedUserId,
      },
      funnelStage: {
        id: funnelStages.id,
        name: funnelStages.name,
        order: funnelStages.order,
        emoji: funnelStages.emoji,
      },
      assignedUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      assignedDepartment: {
        id: departments.id,
        name: departments.name,
      },
      tag: {
        id: tags.id,
        name: tags.name,
        color: tags.color,
      },
    })
    .from(chats)
    .leftJoin(contacts, eq(chats.id, contacts.chatId))
    .leftJoin(funnelStages, eq(contacts.funnelStageId, funnelStages.id))
    .leftJoin(users, eq(contacts.assignedUserId, users.id))
    .leftJoin(departments, eq(contacts.assignedDepartmentId, departments.id))
    .leftJoin(contactTags, eq(contacts.id, contactTags.contactId))
    .leftJoin(tags, eq(contactTags.tagId, tags.id))
    .where(and(...whereConditions))
    .orderBy(
      desc(chats.isPinned),
      desc(chats.pinnedAt),
      desc(chats.lastMessageTimestamp)
    )
    .limit(resolvedLimit);

  // Group and assemble relations (deduplicating chat rows with multiple tags)
  const chatMap = new Map<number, any>();
  for (const row of rows) {
    if (!row.chat) continue;
    let chat = chatMap.get(row.chat.id);
    if (!chat) {
      chat = {
        ...row.chat,
        contact: row.contact?.id
          ? {
              ...row.contact,
              funnelStage: row.funnelStage?.id ? row.funnelStage : null,
              assignedUser: row.assignedUser?.id ? row.assignedUser : null,
              assignedDepartment: row.assignedDepartment?.id ? row.assignedDepartment : null,
              contactTags: [],
            }
          : null,
      };
      chatMap.set(row.chat.id, chat);
    }
    if (row.tag?.id && chat.contact) {
      chat.contact.contactTags.push({ tag: row.tag });
    }
  }

  return Array.from(chatMap.values());
}

export async function getDepartmentIdsForUser(userId: number): Promise<Set<number>> {
  const rows = await db.query.departmentMembers.findMany({
    where: eq(departmentMembers.userId, userId),
    columns: { departmentId: true },
  });
  return new Set(rows.map((d) => d.departmentId));
}
