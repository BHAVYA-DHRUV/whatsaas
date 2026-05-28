import { db } from '@/lib/db/drizzle';
import { chats, departmentMembers } from '@/lib/db/schema';
import { and, desc, eq, isNotNull } from 'drizzle-orm';

export type ListChatsOptions = {
  teamId: number;
  scope?: 'kanban';
  limit?: number;
};

export async function listChatsForTeam({ teamId, scope, limit }: ListChatsOptions) {
  const resolvedLimit = limit ?? (scope === 'kanban' ? 500 : 200);
  const whereConditions = [eq(chats.teamId, teamId)];

  if (scope !== 'kanban') {
    whereConditions.push(isNotNull(chats.lastMessageTimestamp));
  }

  return db.query.chats.findMany({
    where: and(...whereConditions),
    orderBy: [desc(chats.lastMessageTimestamp)],
    limit: resolvedLimit,
    with: {
      contact: {
        columns: {
          id: true,
          name: true,
          notes: true,
          showTimeInStage: true,
          assignedDepartmentId: true,
        },
        with: {
          funnelStage: {
            columns: { id: true, name: true, order: true, emoji: true },
          },
          assignedUser: {
            columns: { id: true, name: true, email: true },
          },
          assignedDepartment: {
            columns: { id: true, name: true },
          },
          contactTags: {
            with: {
              tag: {
                columns: { id: true, name: true, color: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getDepartmentIdsForUser(userId: number): Promise<Set<number>> {
  const rows = await db.query.departmentMembers.findMany({
    where: eq(departmentMembers.userId, userId),
    columns: { departmentId: true },
  });
  return new Set(rows.map((d) => d.departmentId));
}
