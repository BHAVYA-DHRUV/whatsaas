'use client';

import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { Message } from '@/components/chat/types';

type PaginatedResponse = {
  messages: Message[];
  hasMore: boolean;
  total?: number;
};

type MessagesState = {
  messages: Message[];
  hasMore: boolean;
};

async function messagesFetcher(url: string): Promise<MessagesState> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load messages');
  const data: Message[] | PaginatedResponse = await res.json();
  if (Array.isArray(data)) {
    return { messages: data, hasMore: false };
  }
  return { messages: data.messages, hasMore: data.hasMore };
}

const PAGE_SIZE = 50;

/** Paginated chat messages with infinite scroll support. */
export function useChatMessages(baseKey: string | null) {
  const swrKey = useMemo(() => {
    if (!baseKey) return null;
    const sep = baseKey.includes('?') ? '&' : '?';
    return `${baseKey}${sep}limit=${PAGE_SIZE}`;
  }, [baseKey]);

  const { data, error, isLoading, mutate } = useSWR<MessagesState>(swrKey, messagesFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    keepPreviousData: false,
    dedupingInterval: 2_000,
  });

  const [older, setOlder] = useState<Message[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const messages = useMemo(() => {
    const current = data?.messages ?? [];
    const merged = [...older, ...current];
    const byId = new Map<string, Message>();
    for (const m of merged) {
      byId.set(m.id, m);
    }
    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [data?.messages, older]);

  const hasMore = (data?.hasMore ?? false) || hasMoreOlder;

  const loadOlder = useCallback(async () => {
    if (!swrKey || loadingOlder || !hasMore) return;
    const oldest = messages[0];
    if (!oldest?.timestamp) return;

    setLoadingOlder(true);
    try {
      const url = `${swrKey}&before=${encodeURIComponent(new Date(oldest.timestamp).toISOString())}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return;
      const batch: PaginatedResponse = await res.json();
      if (!batch.messages.length) {
        setHasMoreOlder(false);
        return;
      }
      setOlder((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const next = batch.messages.filter((m) => !ids.has(m.id));
        return [...next, ...prev];
      });
      if (!batch.hasMore) setHasMoreOlder(false);
    } finally {
      setLoadingOlder(false);
    }
  }, [swrKey, loadingOlder, hasMore, messages]);

  const resetPagination = useCallback(() => {
    setOlder([]);
    setHasMoreOlder(true);
  }, []);

  const mutateMessages = useCallback(
    (
      updater?: Message[] | ((prev: Message[] | undefined) => Message[]),
      shouldRevalidate = true
    ) => {
      const revalidate = shouldRevalidate !== false;
      if (typeof updater === 'function') {
        void mutate(
          (prev) => {
            const list = updater(prev?.messages);
            return { messages: list ?? [], hasMore: prev?.hasMore ?? false };
          },
          { revalidate }
        );
        return;
      }
      if (Array.isArray(updater)) {
        void mutate({ messages: updater, hasMore: data?.hasMore ?? false }, { revalidate });
        return;
      }
      void mutate(undefined, { revalidate });
    },
    [mutate, data?.hasMore]
  );

  return {
    messages,
    error,
    isLoading,
    hasMore,
    loadingOlder,
    loadOlder,
    mutateMessages,
    resetPagination,
  };
}
