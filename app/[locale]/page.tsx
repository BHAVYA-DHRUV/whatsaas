import { redirect } from 'next/navigation';
import { getTeamForUser } from '@/lib/db/queries';

export default async function LocaleHomePage() {
  let team = null;
  try {
    team = await getTeamForUser();
  } catch (error) {
    console.error('[LocaleHomePage] Failed to get team:', error);
    // Continue to redirect to sign-in on error
  }

  if (team?.id) {
    if (!team.onboardingCompletedAt) {
      redirect('/onboarding');
    }
    if (!team.planId) {
      redirect('/pricing');
    }
    redirect('/dashboard');
  }

  redirect('/sign-in');
}
