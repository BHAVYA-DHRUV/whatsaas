import { db } from '@/lib/db/drizzle';
import { chats, contacts, messages, automations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTeamForUser } from '@/lib/db/queries';

export class TenantAccessError extends Error {
  readonly status = 403;
  constructor(message = 'Forbidden: resource not in your workspace') {
    super(message);
    this.name = 'TenantAccessError';
  }
}

/** Current user's team or null. */
export async function requireTeam() {
  const team = await getTeamForUser();
  if (!team) throw new TenantAccessError('Not authenticated or no team');
  return team;
}

export async function assertChatBelongsToTeam(chatId: number, teamId: number) {
  const row = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.teamId, teamId)),
    columns: { id: true },
  });
  if (!row) throw new TenantAccessError();
  return row;
}

export async function assertMessageBelongsToTeam(messageId: string, teamId: number) {
  const row = await db
    .select({ id: messages.id })
    .from(messages)
    .innerJoin(chats, eq(messages.chatId, chats.id))
    .where(and(eq(messages.id, messageId), eq(chats.teamId, teamId)))
    .limit(1);
  if (!row.length) throw new TenantAccessError();
  return row[0];
}

export async function assertContactBelongsToTeam(contactId: number, teamId: number) {
  const row = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.teamId, teamId)),
    columns: { id: true },
  });
  if (!row) throw new TenantAccessError();
  return row;
}

export async function assertAutomationBelongsToTeam(automationId: number, teamId: number) {
  const row = await db.query.automations.findFirst({
    where: and(eq(automations.id, automationId), eq(automations.teamId, teamId)),
    columns: { id: true },
  });
  if (!row) throw new TenantAccessError();
  return row;
}

/** BullMQ job id prefix per tenant — prevents cross-tenant job collision. */
export function tenantJobId(teamId: number, kind: string, suffix: string) {
  return `t${teamId}:${kind}:${suffix}`;
}
