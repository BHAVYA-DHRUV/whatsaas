import { redirect } from 'next/navigation';
import { getTeamForUser } from '@/lib/db/queries';

export default async function LocaleHomePage() {
  const team = await getTeamForUser();
  
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
