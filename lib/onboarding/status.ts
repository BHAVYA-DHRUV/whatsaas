import type { teams, evolutionInstances } from '@/lib/db/schema';

type TeamLike = Pick<typeof teams.$inferSelect, 'name' | 'planId' | 'onboardingCompletedAt'> & {
  evolutionInstances?: Pick<typeof evolutionInstances.$inferSelect, 'id'>[];
};

const DEFAULT_TEAM_NAME = /'s Team$/i;

export function isDefaultWorkspaceName(name: string): boolean {
  return DEFAULT_TEAM_NAME.test(name.trim());
}

export function hasFinishedOnboarding(team: TeamLike): boolean {
  return team.onboardingCompletedAt != null;
}

export function getOnboardingSteps(team: TeamLike) {
  const instanceCount = team.evolutionInstances?.length ?? 0;
  return {
    workspace: !isDefaultWorkspaceName(team.name),
    plan: team.planId != null,
    whatsapp: instanceCount > 0,
    team: true,
  };
}

/** Wizard progress only — not used for route guards (avoids redirect loops). */
export function hasMetOnboardingSteps(team: TeamLike): boolean {
  const steps = getOnboardingSteps(team);
  return steps.workspace && steps.plan;
}
