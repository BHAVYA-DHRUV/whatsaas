'use client';

import React, { useDeferredValue, useMemo, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/routing';
import {
  MessageCircle,
  PlusCircle,
  Search,
  Smartphone,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { ChatListSkeleton, type Chat } from '@/components/dashboard/ChatListItem';
import { ChatFilters } from '@/components/dashboard/ChatFilters';
import { NewChatDialog } from '@/components/dashboard/NewChatDialog';
import { VirtualizedChatList } from '@/components/inbox/VirtualizedChatList';
import { useInboxRealtime } from '@/lib/realtime/use-team-channel';
import { pathWithoutLocale } from '@/lib/navigation/path-utils';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

type FilterState = {
  funnelStageId: number | null;
  tagId: number | null;
  agentId: number | null;
  instanceId: number | null;
};

function chatsUrl(activeTab: string) {
  if (activeTab === 'archived') return '/api/chats?scope=archived';
  return '/api/chats';
}

export function InboxShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const path = pathWithoutLocale(pathname);

  const activeChatNumber = path.split('/inbox/chat/')[1]?.split('?')[0] || null;
  const activeInstanceId = searchParams.get('instanceId');
  const isChatOpen = Boolean(activeChatNumber);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [detailedFilters, setDetailedFilters] = useState<FilterState>({
    funnelStageId: null,
    tagId: null,
    agentId: null,
    instanceId: null,
  });
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const { data: teamData } = useSWR<{ id: number }>('/api/team', fetcher);
  const teamId = teamData?.id;

  const { data: chats, isLoading, error, mutate: mutateChats } = useSWR<Chat[]>(
    chatsUrl(activeTab),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 3000,
      keepPreviousData: true,
    }
  );

  const { data: instances } = useSWR<{ dbId: number; instanceName: string; status: string }[]>(
    '/api/instance/details',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 15000 }
  );

  const hasOpenInstance = useMemo(() => {
    return (instances || []).some((inst: any) => inst.status === 'open');
  }, [instances]);

  const validChats = useMemo(() => {
    if (!chats || !Array.isArray(chats)) return [];
    return chats.filter((chat) => {
      if (activeTab === 'pinned' && !chat.isPinned) return false;
      if (activeTab === 'archived' && !chat.isArchived) return false;
      if (activeTab !== 'archived' && chat.isArchived) return false;

      if (deferredSearchQuery) {
        const q = deferredSearchQuery.toLowerCase();
        const name = (chat.name || chat.pushName || chat.remoteJid || '').toLowerCase();
        const last = (chat.lastMessage || chat.lastMessageText || '').toLowerCase();
        if (!name.includes(q) && !last.includes(q)) return false;
      }

      if (activeTab === 'unread' && !(chat.unreadCount && chat.unreadCount > 0)) return false;

      if (detailedFilters.funnelStageId && chat.contact?.funnelStage?.id !== detailedFilters.funnelStageId)
        return false;
      if (detailedFilters.tagId) {
        const tagIds = chat.contact?.tags?.map((t) => t.id) ?? [];
        if (!tagIds.includes(detailedFilters.tagId)) return false;
      }
      if (detailedFilters.agentId && chat.contact?.assignedUser?.id !== detailedFilters.agentId)
        return false;
      if (detailedFilters.instanceId && chat.instanceId !== detailedFilters.instanceId) return false;

      return true;
    });
  }, [chats, deferredSearchQuery, activeTab, detailedFilters]);

  const sortedChats = useMemo(() => {
    return [...validChats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const ta = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
      const tb = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
      return tb - ta;
    });
  }, [validChats]);

  useInboxRealtime(teamId, useCallback(() => {
    void mutateChats();
  }, [mutateChats]));

  const triggeredSyncRef = React.useRef<Record<number, boolean>>({});

  React.useEffect(() => {
    if (instances && Array.isArray(instances)) {
      const openInstance = instances.find((inst: any) => inst.status === 'open');
      if (openInstance && !triggeredSyncRef.current[openInstance.dbId]) {
        triggeredSyncRef.current[openInstance.dbId] = true;
        console.log(`[InboxShell] Automatically syncing chats for open instance ${openInstance.instanceName}...`);
        fetch('/api/instance/sync-chats/auto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: openInstance.dbId }),
        })
          .then((res) => {
            if (res.ok) {
              console.log('[InboxShell] Auto-sync triggered successfully.');
              void mutateChats();
            }
          })
          .catch((err) => console.error('[InboxShell] Failed to trigger auto-sync:', err));
      }
    }
  }, [instances, mutateChats]);

  const instanceRows = useMemo(
    () =>
      (instances || []).map((i) => ({
        dbId: i.dbId,
        instanceName: i.instanceName,
        integration: 'WHATSAPP-BAILEYS' as const,
      })),
    [instances]
  );

  const showListOnMobile = !isChatOpen;

  return (
    <div className="flex h-full min-h-0 bg-muted/30">
      {/* Chat list panel */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card min-h-0 shrink-0',
          'w-full md:w-85 lg:w-95',
          !showListOnMobile && 'hidden md:flex'
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <h2 className="text-lg font-semibold tracking-tight">Inbox</h2>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsNewChatOpen(true)}>
            <PlusCircle className="h-5 w-5" />
          </Button>
        </header>

        <div className="shrink-0 border-b px-3 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats…"
              className="h-10 rounded-xl border-border/60 bg-muted/40 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <ChatFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filters={detailedFilters}
          setFilters={setDetailedFilters}
          instances={instances || []}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          {isLoading && (
            <div>
              {Array.from({ length: 6 }).map((_, i) => (
                <ChatListSkeleton key={i} />
              ))}
            </div>
          )}
          {error && (
            <p className="p-4 text-center text-sm text-destructive">Failed to load chats.</p>
          )}
          {!isLoading && !error && sortedChats.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {activeTab === 'archived'
                  ? 'No archived chats.'
                  : chats?.length
                    ? 'No chats match your filters.'
                    : 'No conversations yet.'}
              </p>
              {!chats?.length && activeTab === 'all' && (
                hasOpenInstance ? (
                  <Button variant="default" size="sm" onClick={() => setIsNewChatOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Start New Chat
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/settings/connect">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Connect WhatsApp
                    </Link>
                  </Button>
                )
              )}
            </div>
          )}
          {!isLoading && !error && sortedChats.length > 0 && (
            <VirtualizedChatList
              chats={sortedChats}
              activeChatNumber={activeChatNumber}
              activeInstanceId={activeInstanceId}
              instances={instanceRows}
            />
          )}
        </div>
      </aside>

      {/* Conversation + CRM */}
      <main className={cn('flex min-w-0 flex-1 flex-col min-h-0', !showListOnMobile ? 'flex' : 'hidden md:flex')}>
        {isChatOpen && (
          <div className="flex md:hidden h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/inbox')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium">Conversation</span>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </main>

      <NewChatDialog
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        instances={instances || []}
      />
    </div>
  );
}
