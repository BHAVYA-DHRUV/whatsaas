'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { MessageCircle, PlusCircle, Search, Smartphone, XCircle } from 'lucide-react';
import { ChatListSkeleton, type Chat } from '@/components/dashboard/ChatListItem';
import { ChatFilters } from '@/components/dashboard/ChatFilters';
import { NewChatDialog } from '@/components/dashboard/NewChatDialog';
import { VirtualizedChatList } from '@/components/inbox/VirtualizedChatList';
import { useInboxRealtime } from '@/lib/realtime/use-team-channel';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

type FilterState = {
  funnelStageId: number | null;
  tagId: number | null;
  agentId: number | null;
  instanceId: number | null;
};

export function InboxShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeChatNumber = pathname.split('/chat/')[1]?.split('?')[0] || null;
  const activeInstanceId = searchParams.get('instanceId');

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
  const { data: chats, isLoading, error, mutate: mutateChats } = useSWR<Chat[]>('/api/chats', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 5000,
    keepPreviousData: true,
  });
  const { data: instances } = useSWR<{ dbId: number; instanceName: string }[]>('/api/instance/details', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 15000,
  });

  const validChats = useMemo(() => {
    if (!chats) return [];
    return chats.filter((chat) => {
      if (deferredSearchQuery) {
        const q = deferredSearchQuery.toLowerCase();
        const name = (chat.name || chat.pushName || chat.remoteJid || '').toLowerCase();
        const last = (chat.lastMessage || '').toLowerCase();
        if (!name.includes(q) && !last.includes(q)) return false;
      }
      if (activeTab === 'unread' && !(chat.unreadCount && chat.unreadCount > 0)) return false;
      if (detailedFilters.funnelStageId && chat.contact?.funnelStage?.id !== detailedFilters.funnelStageId)
        return false;
      if (detailedFilters.tagId) {
        const tagIds = chat.contact?.tags?.map((t) => t.id) ?? [];
        if (!tagIds.includes(detailedFilters.tagId)) return false;
      }
      if (detailedFilters.agentId && chat.contact?.assignedUser?.id !== detailedFilters.agentId) return false;
      if (detailedFilters.instanceId && chat.instanceId !== detailedFilters.instanceId) return false;
      return true;
    });
  }, [chats, deferredSearchQuery, activeTab, detailedFilters]);

  useInboxRealtime(teamId, () => {
    void mutateChats();
  });

  const instanceRows = useMemo(
    () =>
      (instances || []).map((i) => ({
        dbId: i.dbId,
        instanceName: i.instanceName,
        integration: 'WHATSAPP-BAILEYS' as const,
      })),
    [instances]
  );

  return (
    <div className="flex h-full min-h-0 bg-muted/40">
      <aside className="flex w-full max-w-md flex-col border-r bg-card md:w-[35%] lg:w-[28%] min-h-0">
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b px-4">
          <h2 className="font-semibold">Inbox</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsNewChatOpen(true)}>
            <PlusCircle className="h-5 w-5" />
          </Button>
        </header>
        <div className="shrink-0 border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats…"
              className="h-11 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
              >
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <ChatFilters
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filters={detailedFilters}
            setFilters={setDetailedFilters}
            instances={instances || []}
          />
        </div>
        <div className="min-h-0 flex-1">
          {isLoading && <ChatListSkeleton />}
          {error && (
            <p className="p-4 text-center text-sm text-destructive">Failed to load chats.</p>
          )}
          {!isLoading && !error && validChats.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                {chats?.length ? 'No chats match your filters.' : 'No conversations yet.'}
              </p>
              {!chats?.length && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings/connect">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Connect WhatsApp
                  </Link>
                </Button>
              )}
            </div>
          )}
          {!isLoading && !error && validChats.length > 0 && (
            <VirtualizedChatList
              chats={validChats}
              activeChatNumber={activeChatNumber}
              activeInstanceId={activeInstanceId}
              instances={instanceRows}
            />
          )}
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      <NewChatDialog isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} instances={instances || []} />
    </div>
  );
}
