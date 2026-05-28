import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { plans, teams } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';

const bodySchema = z.object({
  planId: z.number().int().positive(),
});

export async function POST(request: Request) {
  const team = await getTeamForUser();
  if (!team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const plan = await db.query.plans.findFirst({
    where: eq(plans.id, parsed.data.planId),
  });

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  if (plan.amount > 0) {
    return NextResponse.json(
      { error: 'Use checkout for paid plans', requiresCheckout: true, planId: plan.id },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(teams)
    .set({
      planId: plan.id,
      planName: plan.name,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    })
    .where(eq(teams.id, team.id))
    .returning({ id: teams.id, planId: teams.planId, planName: teams.planName });

  return NextResponse.json({ team: updated });
}
