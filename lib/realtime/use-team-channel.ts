'use client';

import { useEffect, useRef } from 'react';
import { getTeamChannel } from '@/lib/pusher-client';
import { RealtimeEvents } from '@/lib/realtime/events';

type Handler = (payload: unknown) => void;

/**
 * Subscribe to team channel events with guaranteed cleanup (prevents duplicate listeners).
 */
export function useTeamChannel(
  teamId: number | undefined,
  handlers: Partial<Record<string, Handler>>,
  debounceMs = 0
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!teamId) return;
    const channel = getTeamChannel(teamId);
    if (!channel) return;

    const wrapped: Array<{ event: string; fn: Handler; wrappedFn: Handler }> = [];
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    for (const [event, handler] of Object.entries(handlersRef.current)) {
      if (!handler) continue;
      const wrappedFn: Handler = (payload) => {
        if (debounceMs <= 0) {
          handler(payload);
          return;
        }
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => handler(payload), debounceMs);
      };
      channel.bind(event, wrappedFn);
      wrapped.push({ event, fn: handler, wrappedFn });
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      for (const { event, wrappedFn } of wrapped) {
        channel.unbind(event, wrappedFn);
      }
    };
  }, [teamId, debounceMs]);
}

/** Preset: inbox list refresh on message / list update */
export function useInboxRealtime(teamId: number | undefined, onRefresh: () => void) {
  useTeamChannel(
    teamId,
    {
      [RealtimeEvents.NEW_MESSAGE]: onRefresh,
      [RealtimeEvents.CHAT_LIST_UPDATE]: onRefresh,
    },
    150
  );
}
