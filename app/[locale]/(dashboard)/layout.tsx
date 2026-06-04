import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTeamForUser } from '@/lib/db/queries';
import { pathWithoutLocale } from '@/lib/navigation/path-utils';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();

  const pathname = headersList.get('x-pathname') ?? '';
  const path = pathWithoutLocale(pathname);

  const isHomePage = path === '/' || path === '';

  const isOnboardingRoute =
    path === '/onboarding' || path.startsWith('/onboarding/');

  const isPricingRoute =
    path === '/pricing' || path.startsWith('/pricing/');

  const team = await getTeamForUser();

  if (
    team?.id &&
    !isHomePage &&
    !isOnboardingRoute &&
    !isPricingRoute
  ) {
    if (!team.onboardingCompletedAt) {
      redirect('/onboarding');
    }

    if (!team.planId) {
      redirect('/pricing');
    }
  }

  return (
    <DashboardShell path={path}>
      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </DashboardShell>
  );
}