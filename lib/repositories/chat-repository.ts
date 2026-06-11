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
import { and, desc, eq, isNull, gt, sql, or } from 'drizzle-orm';

export type ListChatsOptions = {
  teamId: number;
  scope?: 'kanban' | 'archived' | 'unread' | 'pinned' | 'all';
  limit?: number;
};

export async function listChatsForTeam({ teamId, scope, limit }: ListChatsOptions) {
  const resolvedLimit = limit ?? (scope === 'kanban' ? 500 : 200);
  const whereConditions = [eq(chats.teamId, teamId), isNull(chats.deletedAt)];
  console.log('[DB] listChatsForTeam - teamId:', teamId, 'scope:', scope, 'limit:', resolvedLimit);
  
  // DEBUG: Check isArchived values in database before filtering
  const allChatsForTeam = await db
    .select({
      id: chats.id,
      remoteJid: chats.remoteJid,
      isArchived: chats.isArchived,
      isPinned: chats.isPinned,
      deletedAt: chats.deletedAt,
      lastMessageTimestamp: chats.lastMessageTimestamp,
    })
    .from(chats)
    .where(eq(chats.teamId, teamId))
    .limit(10);
  
  console.log('[DB] DEBUG - First 10 chats raw isArchived values:', allChatsForTeam.map(c => ({
    id: c.id,
    remoteJid: c.remoteJid,
    isArchived: c.isArchived,
    isPinned: c.isPinned,
    deletedAt: c.deletedAt,
    hasTimestamp: !!c.lastMessageTimestamp
  })));

  if (scope === 'archived') {
    whereConditions.push(eq(chats.isArchived, true));
  } else {
    const archivedCondition = or(eq(chats.isArchived, false), isNull(chats.isArchived));
    if (archivedCondition) {
      whereConditions.push(archivedCondition);
    }
    if (scope === 'unread') {
      whereConditions.push(gt(chats.unreadCount, 0));
    } else if (scope === 'pinned') {
      whereConditions.push(eq(chats.isPinned, true));
    }
  }

  console.log('[DB] whereConditions before scope filter:', whereConditions.map(c => c));

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
        hasStarred: sql<boolean>`EXISTS (SELECT 1 FROM messages WHERE messages.chat_id = ${chats.id} AND messages.is_starred = true)`.as('has_starred'),
        hasMedia: sql<boolean>`EXISTS (SELECT 1 FROM messages WHERE messages.chat_id = ${chats.id} AND messages.media_url IS NOT NULL)`.as('has_media'),
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
    .leftJoin(contacts, and(eq(chats.id, contacts.chatId), isNull(contacts.deletedAt)))
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

  console.log('[DB] Raw DB query returned rows:', rows.length);
  console.log('[DB] Sample row:', rows[0] ? { chatId: rows[0].chat?.id, remoteJid: rows[0].chat?.remoteJid, isArchived: rows[0].chat?.isArchived } : 'No rows');

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

  const result = Array.from(chatMap.values());
  console.log('[DB] After deduplication, returning chats:', result.length);
  console.log('[DB] Sample chat:', result[0] ? { id: result[0].id, remoteJid: result[0].remoteJid, isArchived: result[0].isArchived } : 'No chats');
  return result;
}

export async function getDepartmentIdsForUser(userId: number): Promise<Set<number>> {
  const rows = await db.query.departmentMembers.findMany({
    where: eq(departmentMembers.userId, userId),
    columns: { departmentId: true },
  });
  return new Set(rows.map((d) => d.departmentId));
}
