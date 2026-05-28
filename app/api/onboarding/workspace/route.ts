import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';

const bodySchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export async function PATCH(request: Request) {
  const team = await getTeamForUser();
  if (!team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid workspace name' }, { status: 400 });
  }

  const [updated] = await db
    .update(teams)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(teams.id, team.id))
    .returning({ id: teams.id, name: teams.name });

  return NextResponse.json({ team: updated });
}
