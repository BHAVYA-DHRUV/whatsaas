'use client';

import { memo, useMemo } from 'react';
import useSWR from 'swr';
import { MessageSquare, Users, Megaphone, Bot, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

type Metrics = {
  chatCount: number;
  unreadTotal: number;
  planName: string | null;
  teamName: string | null;
};

function DashboardOverviewPageInner() {
  const { data: metrics } = useSWR<Metrics>('/api/dashboard/metrics', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 15000,
  });

  const stats = useMemo(
    () => [
      { label: 'Active chats', value: metrics?.chatCount ?? '—', icon: MessageSquare },
      { label: 'Unread messages', value: metrics?.unreadTotal ?? '—', icon: MessageSquare },
      { label: 'Workspace', value: metrics?.teamName ?? '—', icon: Users },
      { label: 'Plan', value: metrics?.planName ?? 'Trial', icon: Megaphone },
    ],
    [metrics]
  );

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your WhatsApp CRM workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold truncate">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Inbox
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Open conversations, assign agents, and reply in real time.
              </p>
              <Button asChild>
                <Link href="/inbox">
                  Open inbox
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automations & AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure flows, AI assistants, and campaign tools.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild size="sm">
                  <Link href="/dashboard/automations">Automations</Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href="/dashboard/ai">AI settings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardOverviewPageInner);
