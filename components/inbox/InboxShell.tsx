'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { isDigitOnlyQuery } from '@/lib/search/normalize';
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
import { useTeamChannel } from '@/lib/realtime/use-team-channel';
import { pathWithoutLocale } from '@/lib/navigation/path-utils';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getChatInitials, formatChatListTime, getChatDisplayName, sortConversationsByLatestActivity } from '@/lib/inbox/utils';
import { HighlightMatch } from './HighlightMatch';
import { ensureConversationArray } from '@/lib/types/conversation';

const fetcher = (url: string) => 
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((data) => {
      // Runtime validation for chat endpoints
      if (url.includes('/api/chats') && !url.includes('/api/chats/search')) {
        return ensureConversationArray(data);
      }
      return data;
    });

const parseTimestampSafe = (ts: any): number => {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const parsed = Date.parse(ts);
  return isNaN(parsed) ? 0 : parsed;
};

type FilterState = {
  funnelStageId: number | null;
  tagId: number | null;
  agentId: number | null;
  instanceId: number | null;
};

export function InboxShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const path = pathWithoutLocale(pathname);

  const activeChatNumber = path.split('/inbox/chat/')[1]?.split('?')[0] || null;
  const activeInstanceId = searchParams.get('instanceId');
  const isChatOpen = Boolean(activeChatNumber);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // ── Tab & filter state (declared early so search SWR can reference activeTab) ──
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(() => tabParam || 'all');
  const [detailedFilters, setDetailedFilters] = useState<FilterState>({
    funnelStageId: null,
    tagId: null,
    agentId: null,
    instanceId: null,
  });
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    // 200ms debounce — fast enough to feel real-time
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Allow 1-char search for digit-only queries (phone number partial search)
  const isPhoneQuery = isDigitOnlyQuery(debouncedSearchQuery);
  const shouldSearch =
    debouncedSearchQuery.length >= 2 ||
    (debouncedSearchQuery.length === 1 && isPhoneQuery);

  const { data: searchResults, isValidating: isSearching } = useSWR<any[]>(
    shouldSearch
      ? `/api/chats/search?q=${encodeURIComponent(debouncedSearchQuery)}&tab=${activeTab}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3000 }
  );

  const [focusedIndex, setFocusedIndex] = useState(-1);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchQuery]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!searchResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1 < searchResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        e.preventDefault();
        const selected = searchResults[focusedIndex];
        const rjid: string | undefined = selected.chat?.remoteJid;
        if (!rjid) return;
        const isGroupChat = rjid.endsWith('@g.us');
        const chatIdentifier = isGroupChat ? rjid : rjid.split('@')[0];

        let href = '';
        if (selected.type === 'chat') {
          href = `/inbox/chat/${encodeURIComponent(chatIdentifier)}${
            selected.chat.instanceId ? `?instanceId=${selected.chat.instanceId}` : ''
          }`;
        } else {
          href = `/inbox/chat/${encodeURIComponent(chatIdentifier)}?messageId=${
            selected.matchedMessage.id
          }${selected.chat.instanceId ? `&instanceId=${selected.chat.instanceId}` : ''}`;
        }
        router.push(href);
        setSearchQuery('');
      }
    }
  }, [searchResults, focusedIndex, router]);


  const { data: teamData } = useSWR<{ id: number }>('/api/team', fetcher);
  const teamId = teamData?.id;

  const { data: allChats, isLoading: isLoadingAll, error: errorAll, mutate: mutateAllChats } = useSWR<Chat[]>(
    '/api/chats',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,   // socket events handle real-time — no need to poll on every nav
      dedupingInterval: 10_000,
      keepPreviousData: true,
      onSuccess: (data) => {
        if (!Array.isArray(data)) {
          console.error('[InboxShell] SWR /api/chats returned non-array:', typeof data, data);
        }
      },
    }
  );

  const { data: archivedChats, isLoading: isLoadingArchived, error: errorArchived, mutate: mutateArchivedChats } = useSWR<Chat[]>(
    '/api/chats/archive',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,   // socket events handle real-time — no need to poll on every nav
      dedupingInterval: 10_000,
      keepPreviousData: true,
      onSuccess: (data) => {
        if (!Array.isArray(data)) {
          console.error('[InboxShell] SWR /api/chats/archive returned non-array:', typeof data, data);
        }
      },
    }
  );

  const chats = activeTab === 'archived' ? archivedChats : allChats;
  const safeChats = Array.isArray(chats) ? chats : [];

  // Stabilize chat references across renders to prevent unnecessary re-renders of VirtualizedChatItem
  const prevChatsRef = React.useRef<Chat[]>([]);
  const stabilizedChats = useMemo(() => {
    const prevChatsMap = new Map(prevChatsRef.current.map((c) => [c.id, c]));
    
    const isContactEqual = (a?: any, b?: any) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return (
        a.id === b.id &&
        a.name === b.name &&
        a.phone === b.phone &&
        a.assignedUser?.id === b.assignedUser?.id &&
        a.funnelStage?.id === b.funnelStage?.id &&
        JSON.stringify(a.tags) === JSON.stringify(b.tags)
      );
    };

    const result = safeChats.map((chat) => {
      const prev = prevChatsMap.get(chat.id);
      if (!prev) return chat;
      
      const isIdentical = 
        prev.remoteJid === chat.remoteJid &&
        prev.name === chat.name &&
        prev.pushName === chat.pushName &&
        prev.profilePicUrl === chat.profilePicUrl &&
        prev.lastMessage === chat.lastMessage &&
        prev.lastMessageText === chat.lastMessageText &&
        prev.lastMessageTimestamp === chat.lastMessageTimestamp &&
        prev.lastCustomerInteraction === chat.lastCustomerInteraction &&
        prev.unreadCount === chat.unreadCount &&
        prev.isPinned === chat.isPinned &&
        prev.isArchived === chat.isArchived &&
        prev.lastMessageStatus === chat.lastMessageStatus &&
        prev.lastMessageFromMe === chat.lastMessageFromMe &&
        isContactEqual(prev.contact, chat.contact);
      
      return isIdentical ? prev : chat;
    });
    
    prevChatsRef.current = result;
    return result;
  }, [safeChats]);

  // isLoading is true only on the very FIRST fetch (no cached data yet).
  // During background revalidation, keepPreviousData keeps the old data visible
  // so isLoading stays false — no flash, no skeleton on navigation.
  const isLoading = activeTab === 'archived'
    ? (isLoadingArchived && !archivedChats)
    : (isLoadingAll && !allChats);
  const error = activeTab === 'archived' ? errorArchived : errorAll;

  const filterCounts = useMemo(() => {
    const safeActiveList = Array.isArray(allChats) ? allChats : [];
    const safeArchivedList = Array.isArray(archivedChats) ? archivedChats : [];
    
    return {
      all: safeActiveList.length,
      unread: safeActiveList.filter((c) => (c.unreadCount ?? 0) > 0).length,
      pinned: safeActiveList.filter((c) => c.isPinned).length,
      archived: safeArchivedList.length,
      starred: safeActiveList.filter((c) => c.hasStarred).length,
      media: safeActiveList.filter((c) => c.hasMedia).length,
    };
  }, [allChats, archivedChats]);

  const { data: instances } = useSWR<{ dbId: number; instanceName: string; status: string }[]>(
    '/api/instance/details',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 15000 }
  );

  const hasOpenInstance = useMemo(() => {
    return (instances || []).some((inst: any) => inst.status === 'open');
  }, [instances]);

  const validChats = useMemo(() => {
    const filtered = stabilizedChats.filter((chat) => {
      if (activeTab === 'pinned' && !chat.isPinned) return false;
      if (activeTab !== 'archived' && chat.isArchived) return false;
      if (activeTab === 'unread' && !(chat.unreadCount && chat.unreadCount > 0)) return false;
      if (activeTab === 'starred' && !chat.hasStarred) return false;

      if (detailedFilters.funnelStageId && chat.contact?.funnelStage?.id !== detailedFilters.funnelStageId)
        return false;
      if (detailedFilters.tagId) {
        const tagIds = chat.contact?.tags?.map((t: any) => t.id) ?? [];
        if (!tagIds.includes(detailedFilters.tagId)) return false;
      }
      if (detailedFilters.agentId && chat.contact?.assignedUser?.id !== detailedFilters.agentId)
        return false;
      if (detailedFilters.instanceId && chat.instanceId !== detailedFilters.instanceId) return false;

      return true;
    });
    return filtered;
  }, [safeChats, activeTab, detailedFilters]);

  const uniqueChats = useMemo(() => {
    const seen = new Set<string>();
    return validChats.filter((chat) => {
      const key = `${chat.remoteJid}_${chat.instanceId || 'default'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [validChats]);

  const sortedChats = useMemo(() => {
    return sortConversationsByLatestActivity(uniqueChats);
  }, [uniqueChats]);

  const handleChatListUpdate = useCallback((payload: any) => {
    // Guard: every chat-list-update event MUST carry a numeric id.
    // If it does not, the backend emitted an invalid payload — skip silently.
    if (!payload || typeof payload.id !== 'number') {
      console.warn('[InboxShell] chat-list-update: invalid payload (missing id), skipping', payload);
      return;
    }

    /**
     * Build a full Chat object from a payload when the chat doesn't yet exist
     * in any local SWR cache. Returns null (and logs a warning) when the
     * payload lacks `remoteJid` — we never call .split() on undefined.
     */
    const buildChatFromPayload = (): Chat | null => {
      if (!payload.remoteJid) {
        console.warn(
          '[InboxShell] chat-list-update: new chat payload is missing remoteJid — cannot render row safely.',
          payload
        );
        return null;
      }
      return {
        id: payload.id,
        teamId: teamId!,
        remoteJid: payload.remoteJid,
        instanceId: payload.instanceId ?? null,
        name: payload.name ?? payload.pushName ?? payload.remoteJid.split('@')[0],
        pushName: payload.pushName ?? null,
        profilePicUrl: payload.profilePicUrl ?? null,
        lastMessage: payload.lastMessageText ?? 'New message',
        lastMessageText: payload.lastMessageText ?? 'New message',
        lastMessageTimestamp: payload.lastMessageTimestamp ?? new Date().toISOString(),
        lastCustomerInteraction: payload.lastMessageFromMe
          ? null
          : (payload.lastMessageTimestamp ?? new Date().toISOString()),
        unreadCount: payload.unreadCount ?? 1,
        lastMessageStatus: payload.lastMessageStatus ?? null,
        lastMessageFromMe: payload.lastMessageFromMe ?? false,
        isPinned: payload.isPinned ?? false,
        isArchived: payload.isArchived ?? false,
        hasStarred: false,
        hasMedia: false,
        contact: undefined,
      } as Chat;
    };

    const archiveFlagPresent = typeof payload.isArchived === 'boolean';

    if (archiveFlagPresent) {
      // ── Reactive archive / unarchive move ────────────────────────────────
      // Move the chat between the two SWR caches so the UI updates instantly
      // without waiting for a network round-trip.
      if (payload.isArchived) {
        // Remove from active list
        mutateAllChats((current) => {
          if (!current) return current;
          return current.filter((c) => c.id !== payload.id);
        }, { revalidate: false });

        // Add / update in archived list
        mutateArchivedChats((current) => {
          if (!current) return current;
          const idx = current.findIndex((c) => c.id === payload.id);
          if (idx > -1) {
            const updated = [...current];
            updated[idx] = { ...updated[idx], ...payload };
            return updated;
          }
          const newChat = buildChatFromPayload();
          if (!newChat) {
            // We don't have enough data to render the row — revalidate from server
            void mutateArchivedChats();
            return current;
          }
          return [newChat, ...current];
        }, { revalidate: false });
      } else {
        // Remove from archived list
        mutateArchivedChats((current) => {
          if (!current) return current;
          return current.filter((c) => c.id !== payload.id);
        }, { revalidate: false });

        // Add / update in active list
        mutateAllChats((current) => {
          if (!current) return current;
          const idx = current.findIndex((c) => c.id === payload.id);
          if (idx > -1) {
            const updated = [...current];
            const updatedChat = { ...updated[idx], ...payload };
            updated.splice(idx, 1);
            return [updatedChat, ...updated];
          }
          const newChat = buildChatFromPayload();
          if (!newChat) {
            void mutateAllChats();
            return current;
          }
          return [newChat, ...current];
        }, { revalidate: false });
      }
      return;
    }

    // ── In-place update (no archive change) ──────────────────────────────
    // Try to find and update the chat in either list. Track whether we found
    // it so we know whether to add it as a brand-new row.
    let foundInAnyList = false;

    mutateAllChats((current) => {
      if (!current) return current;
      const idx = current.findIndex((c) => c.id === payload.id);
      if (idx > -1) {
        foundInAnyList = true;
        const updated = [...current];
        const updatedChat = {
          ...updated[idx],
          ...payload,
          contact: payload.contact ?? updated[idx].contact,
          name: payload.name ?? updated[idx].name,
          pushName: payload.pushName ?? updated[idx].pushName,
          lastMessage: payload.lastMessageText ?? updated[idx].lastMessage,
        };
        updated.splice(idx, 1);
        return [updatedChat, ...updated];
      }
      return current;
    }, { revalidate: false });

    mutateArchivedChats((current) => {
      if (!current) return current;
      const idx = current.findIndex((c) => c.id === payload.id);
      if (idx > -1) {
        foundInAnyList = true;
        const updated = [...current];
        const updatedChat = {
          ...updated[idx],
          ...payload,
          contact: payload.contact ?? updated[idx].contact,
          name: payload.name ?? updated[idx].name,
          pushName: payload.pushName ?? updated[idx].pushName,
          lastMessage: payload.lastMessageText ?? updated[idx].lastMessage,
        };
        updated[idx] = updatedChat;
        return updated;
      }
      return current;
    }, { revalidate: false });

    // Brand-new chat not yet in any local cache → add to active list
    if (!foundInAnyList) {
      const newChat = buildChatFromPayload();
      if (newChat) {
        mutateAllChats((current) => {
          if (!current) return [newChat];
          return [newChat, ...current];
        }, { revalidate: true });
      }
    }
  }, [mutateAllChats, mutateArchivedChats, teamId]);

function jidsMatch(jid1: string | null | undefined, jid2: string | null | undefined): boolean {
  if (!jid1 || !jid2) return false;
  if (jid1 === jid2) return true;
  const isGroup1 = jid1.endsWith('@g.us');
  const isGroup2 = jid2.endsWith('@g.us');
  if (isGroup1 !== isGroup2) return false;
  if (isGroup1) return jid1 === jid2;
  return jid1.split('@')[0] === jid2.split('@')[0];
}

  const handleNewMessage = useCallback((payload: any) => {
    // Only update the active (non-archived) list.
    // Archived chats don't receive new messages in WhatsApp.
    // Using mutateAllChats (not mutateChats) avoids a double state-update
    // that would cause two consecutive re-renders of the entire chat list.
    void mutateAllChats((currentChats: Chat[] | undefined) => {
      const chatsList = currentChats || [];
      const index = chatsList.findIndex((c) => c.id === payload.chatId);
      if (index > -1) {
        const updated = [...chatsList];
        const isActive = activeChatNumber ? jidsMatch(updated[index].remoteJid, activeChatNumber) : false;
        const unreadInc = (payload.fromMe || isActive) ? 0 : 1;
        const updatedChat = {
          ...updated[index],
          lastMessage: payload.lastMessageTextPreview || payload.text,
          lastMessageText: payload.lastMessageTextPreview || payload.text,
          lastMessageTimestamp: payload.timestamp || new Date().toISOString(),
          lastMessageFromMe: payload.fromMe,
          lastMessageStatus: payload.status,
          unreadCount: (updated[index].unreadCount || 0) + unreadInc,
        };
        updated.splice(index, 1);
        updated.unshift(updatedChat);
        return updated;
      } else if (payload.remoteJid) {
        // Construct brand-new chat in local cache if not found
        const unreadInc = payload.fromMe ? 0 : 1;
        const newChat: Chat = {
          id: payload.chatId,
          teamId: teamId || 0,
          remoteJid: payload.remoteJid,
          instanceId: payload.instanceId || null,
          name: payload.remoteJid.split('@')[0],
          pushName: null,
          profilePicUrl: null,
          lastMessage: payload.lastMessageTextPreview || payload.text || 'New message',
          lastMessageText: payload.lastMessageTextPreview || payload.text || 'New message',
          lastMessageTimestamp: payload.timestamp || new Date().toISOString(),
          lastCustomerInteraction: payload.fromMe ? null : (payload.timestamp || new Date().toISOString()),
          unreadCount: unreadInc,
          lastMessageStatus: payload.status || null,
          lastMessageFromMe: payload.fromMe,
          isPinned: false,
          isArchived: false,
          hasStarred: false,
          hasMedia: false,
          contact: undefined,
        } as Chat;
        return [newChat, ...chatsList];
      }
      return currentChats;
    }, { revalidate: false });
  }, [mutateAllChats, teamId]);

  useTeamChannel(teamId, {
    'chat-list-update': handleChatListUpdate,
    'new-message': handleNewMessage,
    'message_created': handleNewMessage,
    'message_received': handleNewMessage,
    'message_sent': handleNewMessage,
    'conversation_updated': handleChatListUpdate,
    'chat_updated': handleChatListUpdate,
  });

  const triggeredSyncRef = React.useRef<Record<number, boolean>>({});

  React.useEffect(() => {
    if (instances && Array.isArray(instances)) {
      const openInstance = instances.find((inst: any) => inst.status === 'open');
      if (openInstance && !triggeredSyncRef.current[openInstance.dbId]) {
        triggeredSyncRef.current[openInstance.dbId] = true;
        fetch('/api/instance/sync-chats/auto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceId: openInstance.dbId }),
        })
          .then((res) => {
            if (res.ok) {
              // Only revalidate the active list — archived list is unaffected by sync
              void mutateAllChats(undefined, { revalidate: true });
            }
          })
          .catch((err) => console.error('[InboxShell] Failed to trigger auto-sync:', err));
      }
    }
  }, [instances, mutateAllChats]);

  // Stable instanceRows: only rebuild when the actual data changes (not just SWR reference).
  // Instances SWR revalidates every 15s — without this, a new array reference propagates
  // into VirtualizedChatList on every revalidation even when nothing changed.
  const instanceRowsRef = React.useRef<{ dbId: number; instanceName: string; integration: 'WHATSAPP-BAILEYS' }[]>([]);
  const instanceRows = useMemo(() => {
    const next = (instances || []).map((i) => ({
      dbId: i.dbId,
      instanceName: i.instanceName,
      integration: 'WHATSAPP-BAILEYS' as const,
    }));
    // Only update reference if data actually changed
    const prev = instanceRowsRef.current;
    if (
      prev.length === next.length &&
      next.every((n, i) => n.dbId === prev[i]?.dbId && n.instanceName === prev[i]?.instanceName)
    ) {
      return prev; // same reference = VirtualizedChatList memo skips re-render
    }
    instanceRowsRef.current = next;
    return next;
  }, [instances]);

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

        <div className="shrink-0 border-b px-3 py-2.5">
          <div className="relative group">
            <Search className={cn(
              "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200",
              shouldSearch ? "text-primary" : "text-muted-foreground"
            )} />
            <Input
              placeholder="Search chats…"
              className={cn(
                "h-9 rounded-lg pl-9 pr-9 text-sm transition-all duration-200",
                "bg-muted/50 border-border/50",
                "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/50 focus-visible:bg-background",
                shouldSearch && "border-primary/40 bg-background ring-1 ring-primary/20"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            {searchQuery ? (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 flex items-center justify-center transition-colors"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 font-medium pointer-events-none select-none hidden sm:block">
                ⌘K
              </span>
            )}
          </div>
          {shouldSearch && (
            <div className="flex items-center gap-1 mt-1.5 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary/70 font-medium">Searching across all chats &amp; messages</span>
            </div>
          )}
        </div>


        <ChatFilters
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          filters={detailedFilters}
          setFilters={setDetailedFilters}
          instances={instances || []}
          counts={filterCounts}
        />

        <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
          {shouldSearch ? (
            <div className="flex-1 overflow-y-auto min-h-0 bg-background">

              {/* ── Loading skeletons ───────────────────────────────────── */}
              {isSearching && (
                <div className="flex flex-col">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 animate-pulse">
                      <div className="h-11 w-11 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-muted rounded-full w-2/5" />
                        <div className="h-2.5 bg-muted/60 rounded-full w-3/5" />
                      </div>
                      <div className="h-2.5 bg-muted/40 rounded-full w-10 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* ── No results ─────────────────────────────────────────── */}
              {!isSearching && (!searchResults || searchResults.length === 0) && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/70">No results found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No matches for <span className="font-semibold text-foreground/60">"{searchQuery}"</span>
                    </p>
                  </div>
                </div>
              )}

              {/* ── Results ────────────────────────────────────────────── */}
              {!isSearching && searchResults && searchResults.length > 0 && (() => {
                const chatResults = searchResults.filter((r) => r.type === 'chat');
                const msgResults  = searchResults.filter((r) => r.type === 'message');

                return (
                  <div className="flex flex-col">

                    {/* Chat & Contact matches */}
                    {chatResults.length > 0 && (
                      <div>
                        {/* Section header */}
                        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/30 border-b border-border/40 sticky top-0 z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            Chats &amp; Contacts
                          </span>
                          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                            {chatResults.length}
                          </span>
                        </div>

                        {chatResults.map((res: any) => {
                          const rjid: string | undefined = res.chat?.remoteJid;
                          if (!rjid) return null;
                          const isGroupChat = rjid.endsWith('@g.us');
                          const chatIdentifier = isGroupChat ? rjid : rjid.split('@')[0];
                          const href = `/inbox/chat/${encodeURIComponent(chatIdentifier)}${
                            res.chat.instanceId ? `?instanceId=${res.chat.instanceId}` : ''
                          }`;
                          const isMatchActive =
                            chatIdentifier === activeChatNumber &&
                            (!activeInstanceId || res.chat.instanceId === parseInt(activeInstanceId, 10));
                          const globalIdx = searchResults.findIndex((r) => r.id === res.id);
                          const isFocused = globalIdx === focusedIndex;

                          // Smart avatar color from name
                          const displayName = res.chat.name || '';
                          const avatarColors = [
                            'bg-violet-500/20 text-violet-700 dark:text-violet-300',
                            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                            'bg-sky-500/20 text-sky-700 dark:text-sky-300',
                            'bg-amber-500/20 text-amber-700 dark:text-amber-300',
                            'bg-rose-500/20 text-rose-700 dark:text-rose-300',
                            'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
                            'bg-teal-500/20 text-teal-700 dark:text-teal-300',
                            'bg-orange-500/20 text-orange-700 dark:text-orange-300',
                          ];
                          const colorIdx = displayName.charCodeAt(0) % avatarColors.length;
                          const avatarColor = avatarColors[colorIdx] || avatarColors[0];

                          // Smart initials: skip pure digit names
                          const isPhoneNumber = /^\d+$/.test(displayName.trim());
                          const initials = isPhoneNumber
                            ? '#'
                            : getChatInitials(displayName) || '#';

                          return (
                            <Link
                              key={res.id}
                              href={href}
                              onClick={() => setSearchQuery('')}
                              className={cn(
                                'flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer border-b border-border/30 group',
                                'hover:bg-primary/5',
                                isMatchActive && 'bg-primary/8 border-l-[3px] border-l-primary pl-[13px]',
                                isFocused && 'bg-accent/60'
                              )}
                            >
                              {/* Avatar */}
                              <div className="relative shrink-0">
                                <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                                  <AvatarImage src={res.chat.profilePicUrl ?? undefined} className="object-cover" />
                                  <AvatarFallback className={cn('text-xs font-bold', avatarColor)}>
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                {res.chat.isPinned && (
                                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                                    </svg>
                                  </span>
                                )}
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-sm font-semibold truncate text-foreground leading-tight">
                                    <HighlightMatch text={getChatDisplayName(res.chat)} query={searchQuery} />
                                  </h4>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {res.chat.lastMessageTimestamp && (
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {formatChatListTime(res.chat.lastMessageTimestamp)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <p className="text-xs text-muted-foreground truncate leading-relaxed">
                                    <HighlightMatch text={res.chat.lastMessageText || 'No messages yet'} query={searchQuery} />
                                  </p>
                                  {res.chat.unreadCount > 0 && (
                                    <span className="shrink-0 min-w-[18px] h-[18px] bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center px-1">
                                      {res.chat.unreadCount > 99 ? '99+' : res.chat.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        }).filter(Boolean)}
                      </div>
                    )}

                    {/* Message matches */}
                    {msgResults.length > 0 && (
                      <div>
                        {/* Section header */}
                        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/30 border-b border-border/40 border-t sticky top-0 z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            Messages
                          </span>
                          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                            {msgResults.length}
                          </span>
                        </div>

                        {msgResults.map((res: any) => {
                          const rjid: string | undefined = res.chat?.remoteJid;
                          if (!rjid) return null;
                          const isGroupChat = rjid.endsWith('@g.us');
                          const chatIdentifier = isGroupChat ? rjid : rjid.split('@')[0];
                          const href = `/inbox/chat/${encodeURIComponent(chatIdentifier)}?messageId=${
                            res.matchedMessage.id
                          }${res.chat.instanceId ? `&instanceId=${res.chat.instanceId}` : ''}`;
                          const globalIdx = searchResults.findIndex((r) => r.id === res.id);
                          const isFocused = globalIdx === focusedIndex;

                          // Same avatar color logic
                          const msgDisplayName = res.chat.name || '';
                          const msgAvatarColors = [
                            'bg-violet-500/20 text-violet-700 dark:text-violet-300',
                            'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                            'bg-sky-500/20 text-sky-700 dark:text-sky-300',
                            'bg-amber-500/20 text-amber-700 dark:text-amber-300',
                            'bg-rose-500/20 text-rose-700 dark:text-rose-300',
                            'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
                          ];
                          const msgColorIdx = msgDisplayName.charCodeAt(0) % msgAvatarColors.length;
                          const msgAvatarColor = msgAvatarColors[msgColorIdx] || msgAvatarColors[0];
                          const msgIsPhone = /^\d+$/.test(msgDisplayName.trim());
                          const msgInitials = msgIsPhone ? '#' : (getChatInitials(msgDisplayName) || '#');

                          return (
                            <Link
                              key={res.id}
                              href={href}
                              onClick={() => setSearchQuery('')}
                              className={cn(
                                'flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer border-b border-border/30',
                                'hover:bg-primary/5',
                                isFocused && 'bg-accent/60'
                              )}
                            >
                              {/* Avatar */}
                              <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm shrink-0 mt-0.5">
                                <AvatarImage src={res.chat.profilePicUrl ?? undefined} className="object-cover" />
                                <AvatarFallback className={cn('text-xs font-bold', msgAvatarColor)}>
                                  {msgInitials}
                                </AvatarFallback>
                              </Avatar>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-xs font-semibold text-foreground/90 truncate">
                                    <HighlightMatch text={getChatDisplayName(res.chat)} query={searchQuery} />
                                  </span>
                                  <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                                    {formatChatListTime(res.matchedMessage.timestamp)}
                                  </span>
                                </div>

                                {/* Message bubble */}
                                <div className={cn(
                                  'text-xs rounded-xl px-3 py-2 relative leading-relaxed',
                                  res.matchedMessage.fromMe
                                    ? 'bg-primary/10 text-foreground/80 rounded-tr-sm ml-0 mr-auto border border-primary/15'
                                    : 'bg-muted/70 text-foreground/80 rounded-tl-sm border border-border/40'
                                )}>
                                  {res.matchedMessage.fromMe && (
                                    <span className="text-[10px] font-semibold text-primary/70 block mb-0.5">You</span>
                                  )}
                                  <span className="line-clamp-2">
                                    <HighlightMatch text={res.matchedMessage.text} query={searchQuery} />
                                  </span>
                                  {res.matchedMessage.isStarred && (
                                    <span className="inline-flex ml-1 align-middle">
                                      <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                      </svg>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        }).filter(Boolean)}
                      </div>
                    )}

                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              {/* Skeleton: only on very first load when no data exists yet */}
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

              {/* Empty state: only show when not in first-load and genuinely empty */}
              {!isLoading && !error && sortedChats.length === 0 && (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'archived'
                      ? 'No archived chats.'
                      : safeChats.length
                        ? 'No chats match your filters.'
                        : 'No conversations yet.'}
                  </p>
                  {!safeChats.length && activeTab === 'all' && (
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

              {/* Chat list: show as soon as we have any data, even during background refresh */}
              {sortedChats.length > 0 && (
                <VirtualizedChatList
                  chats={sortedChats}
                  activeChatNumber={activeChatNumber}
                  activeInstanceId={activeInstanceId}
                  instances={instanceRows}
                />
              )}
            </>
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
