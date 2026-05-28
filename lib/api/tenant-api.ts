import 'server-only';

import { NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { TenantAccessError } from '@/lib/auth/tenant';

export type ApiTeamContext = {
  team: NonNullable<Awaited<ReturnType<typeof getTeamForUser>>>;
};

/** Returns team or a ready-made 401 response. */
export async function requireApiTeam(): Promise<ApiTeamContext | NextResponse> {
  const team = await getTeamForUser();
  if (!team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { team };
}

export function isApiTeamContext(
  value: ApiTeamContext | NextResponse
): value is ApiTeamContext {
  return 'team' in value;
}

/** Map tenant / unknown errors to JSON responses. */
export function toApiErrorResponse(error: unknown, logLabel?: string) {
  if (error instanceof TenantAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (logLabel) {
    console.error(logLabel, error);
  }
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return NextResponse.json({ error: message }, { status: 500 });
}
