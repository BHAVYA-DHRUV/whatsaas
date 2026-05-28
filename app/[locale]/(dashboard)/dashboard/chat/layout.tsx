import { InboxShell } from '@/components/inbox/InboxShell';

export default function LegacyChatLayout({ children }: { children: React.ReactNode }) {
  return <InboxShell>{children}</InboxShell>;
}
