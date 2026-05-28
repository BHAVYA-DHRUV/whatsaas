'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { isPluginInstalled } from '@/lib/plugins/registry';
import { apiFetcher } from '@/lib/fetcher';

const CallProvider = dynamic(
  () => import('@/providers/call-provider').then((m) => m.CallProvider),
  { ssr: false },
);
const CallConfirmDialog = dynamic(
  () => import('@/components/chat/CallModal').then((m) => m.CallConfirmDialog),
  { ssr: false },
);
const FloatingCallCard = dynamic(
  () => import('@/components/chat/CallModal').then((m) => m.FloatingCallCard),
  { ssr: false },
);

export function CallProviderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pluginInstalled = isPluginInstalled('voice-call');
  const shouldMountVoiceUi = useMemo(() => {
    if (!pathname || !pluginInstalled) return false;
    return (
      pathname.includes('/inbox') ||
      pathname.includes('/settings/voice') ||
      pathname.includes('/contact')
    );
  }, [pathname, pluginInstalled]);

  const { data: features } = useSWR<{ isVoiceCallsEnabled?: boolean }>(
    shouldMountVoiceUi ? '/api/features?all=1' : null,
    apiFetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 30_000,
    }
  );
  const isEnabled = shouldMountVoiceUi && features?.isVoiceCallsEnabled === true;

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <CallProvider>
      {children}
      <CallConfirmDialog />
      <FloatingCallCard />
    </CallProvider>
  );
}
