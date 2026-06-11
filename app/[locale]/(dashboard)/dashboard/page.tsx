'use client';

import { memo, useMemo } from 'react';
import useSWR from 'swr';
import { MessageSquare, Users, Megaphone, Bot, ArrowRight, BarChart3, Smartphone, Settings } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
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
    instanceId?: number | null;
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
  const router = useRouter();
  const { data: bootstrap, isLoading } = useSWR<DashboardBootstrapData>('/api/dashboard/bootstrap', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const stats = useMemo(
    () => [
      { label: 'Active chats', value: bootstrap?.stats.chatCount ?? '—', icon: MessageSquare, href: '/inbox' },
      { label: 'Unread messages', value: bootstrap?.stats.unreadTotal ?? '—', icon: MessageSquare, href: '/inbox?tab=unread' },
      { label: 'Instances', value: bootstrap?.stats.instanceCount ?? '—', icon: Smartphone, href: '/settings/connect' },
      { label: 'Team members', value: bootstrap?.stats.memberCount ?? '—', icon: Users, href: '/settings' },
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

        {/* Metric Cards Grid */}
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
              <Link key={s.label} href={s.href} className="block transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                <Card className="border-border/60 bg-card/80 hover:bg-accent/40 hover:border-primary/20 backdrop-blur-sm cursor-pointer shadow-xs hover:shadow-md transition-all h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                    <s.icon className="w-4 h-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold truncate">{s.value}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Quick Navigation Cards Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Access</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Link href="/contacts" className="block group transition-all duration-200 hover:scale-[1.02]">
              <Card className="hover:border-primary/20 hover:bg-accent/10 transition-all cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">Contacts</p>
                    <p className="text-[11px] text-muted-foreground truncate">Manage client list</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/campaigns" className="block group transition-all duration-200 hover:scale-[1.02]">
              <Card className="hover:border-primary/20 hover:bg-accent/10 transition-all cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">Campaigns</p>
                    <p className="text-[11px] text-muted-foreground truncate">Send bulk messages</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/analytics" className="block group transition-all duration-200 hover:scale-[1.02]">
              <Card className="hover:border-primary/20 hover:bg-accent/10 transition-all cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">Analytics</p>
                    <p className="text-[11px] text-muted-foreground truncate">Traffic & stats</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/settings" className="block group transition-all duration-200 hover:scale-[1.02]">
              <Card className="hover:border-primary/20 hover:bg-accent/10 transition-all cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">Settings</p>
                    <p className="text-[11px] text-muted-foreground truncate">Configure CRM</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Chats Section */}
        {bootstrap?.recentChats && bootstrap.recentChats.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="border-b border-border/40 pb-3">
              <Link href="/inbox" className="group block">
                <CardTitle className="flex items-center gap-2 cursor-pointer group-hover:text-primary transition-colors text-lg">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Recent Chats
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </CardTitle>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {bootstrap.recentChats.map((chat) => {
                  const isGroup = chat.remoteJid.endsWith('@g.us');
                  const jid = isGroup ? chat.remoteJid : chat.remoteJid.split('@')[0];
                  const chatUrl = `/inbox/chat/${encodeURIComponent(jid)}${chat.instanceId ? `?instanceId=${chat.instanceId}` : ''}`;
                  return (
                    <Link key={chat.id} href={chatUrl} className="block transition-all duration-150 active:scale-[0.99]">
                      <div className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border/40 hover:bg-muted/50 transition-all cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate text-foreground">{chat.name || chat.remoteJid}</p>
                          <p className="text-xs truncate text-muted-foreground mt-0.5">{chat.lastMessage || 'No messages'}</p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="px-2 py-0.5 ml-2 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/inbox" className="block group transition-all duration-200 hover:scale-[1.01]">
            <Card className="border-border/60 hover:border-primary/20 hover:bg-accent/10 transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-lg">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Inbox
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Open conversations, assign agents, and reply in real time.
                </p>
                <div className="text-primary font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-all">
                  Open inbox
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <div 
            onClick={() => router.push('/automation')} 
            className="block group transition-all duration-200 hover:scale-[1.01] cursor-pointer"
          >
            <Card className="border-border/60 hover:border-primary/20 hover:bg-accent/10 transition-all h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors text-lg">
                  <Bot className="w-5 h-5 text-primary" />
                  Automations & AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure flows, AI assistants, and campaign tools.
                </p>
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" asChild size="sm" className="hover:bg-primary hover:text-primary-foreground">
                    <Link href="/automation">Automations</Link>
                  </Button>
                  <Button variant="outline" asChild size="sm" className="hover:bg-primary hover:text-primary-foreground">
                    <Link href="/settings/ai">AI settings</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardOverviewPageInner);
