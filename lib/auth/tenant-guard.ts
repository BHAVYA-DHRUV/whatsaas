import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';

/**
 * Ensures API handlers only operate within the authenticated user's team.
 */
export async function requireAuthenticatedTeam() {
  const user = await getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const team = await getTeamForUser();
  if (!team) {
    return { error: NextResponse.json({ error: 'No workspace assigned' }, { status: 403 }) };
  }
  return { user, team };
}

export function assertTenantScope(resourceTeamId: number, sessionTeamId: number) {
  if (resourceTeamId !== sessionTeamId) {
    throw new Error('TENANT_SCOPE_VIOLATION');
  }
}
