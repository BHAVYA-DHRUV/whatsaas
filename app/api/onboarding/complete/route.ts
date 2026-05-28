import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';

export async function POST() {
  const team = await getTeamForUser();
  if (!team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [updated] = await db
    .update(teams)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(teams.id, team.id))
    .returning({
      id: teams.id,
      onboardingCompletedAt: teams.onboardingCompletedAt,
    });

  return NextResponse.json({ team: updated });
}
