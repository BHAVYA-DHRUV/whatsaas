'use client';

import { memo, useMemo } from 'react';
import useSWR from 'swr';
import { MessageSquare, Users, Megaphone, Bot, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

type DashboardBootstrapData = {
  team: {
    id: number;
    name: string;
    planName: string | null;
    onboardingCompletedAt: string | null;
  };
  stats: {
    chatCount: number;
    unreadTotal: number;
    instanceCount: number;
    memberCount: number;
  };
  instances: Array<{
    id: number;
    name: string;
    number: string | null;
    integration: string;
    createdAt: string;
  }>;
  recentChats: Array<{
    id: number;
    remoteJid: string;
    name: string | null;
    lastMessage: string | null;
    lastMessageTimestamp: string | null;
    unreadCount: number;
  }>;
  teamMembers: Array<{
    id: number;
    name: string | null;
    email: string;
    role: string;
  }>;
};

function StatCardSkeleton() {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-4 h-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

function DashboardOverviewPageInner() {
  const { data: bootstrap, isLoading } = useSWR<DashboardBootstrapData>('/api/dashboard/bootstrap', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const stats = useMemo(
    () => [
      { label: 'Active chats', value: bootstrap?.stats.chatCount ?? '—', icon: MessageSquare },
      { label: 'Unread messages', value: bootstrap?.stats.unreadTotal ?? '—', icon: MessageSquare },
      { label: 'Instances', value: bootstrap?.stats.instanceCount ?? '—', icon: Users },
      { label: 'Team members', value: bootstrap?.stats.memberCount ?? '—', icon: Users },
    ],
    [bootstrap]
  );

  return (
    <div className="h-full p-6 overflow-y-auto md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your WhatsApp CRM workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            stats.map((s) => (
              <Card key={s.label} className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <s.icon className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold truncate">{s.value}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {bootstrap?.recentChats && bootstrap.recentChats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bootstrap.recentChats.map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{chat.name || chat.remoteJid}</p>
                      <p className="text-sm truncate text-muted-foreground">{chat.lastMessage || 'No messages'}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="px-2 py-1 ml-2 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
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
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
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
