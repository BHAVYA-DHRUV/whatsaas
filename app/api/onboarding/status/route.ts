import { NextResponse } from 'next/server';
import { getTeamForUser, getPublishedPlans } from '@/lib/db/queries';
import { getOnboardingSteps, hasFinishedOnboarding } from '@/lib/onboarding/status';

export const dynamic = 'force-dynamic';

export async function GET() {
  const team = await getTeamForUser();
  if (!team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const steps = getOnboardingSteps(team);
  const plans = await getPublishedPlans();

  return NextResponse.json({
    completed: hasFinishedOnboarding(team),
    onboardingCompletedAt: team.onboardingCompletedAt ?? null,
    steps,
    team: {
      id: team.id,
      name: team.name,
      planId: team.planId,
      planName: team.planName,
    },
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      amount: p.amount,
      interval: p.interval,
      currency: p.currency,
    })),
  });
}
