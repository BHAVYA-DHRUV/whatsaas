'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getTeamChannel } from '@/lib/pusher-client';
import { RealtimeEvents, type TypingPayload } from '@/lib/realtime/events';

export function useTypingIndicator(teamId: number | undefined, chatId: number | undefined) {
  const [peerTyping, setPeerTyping] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!teamId || !chatId) return;
    const channel = getTeamChannel(teamId);
    if (!channel) return;

    const onTyping = (payload: TypingPayload) => {
      if (payload.chatId !== chatId || !payload.isTyping) {
        if (payload.chatId === chatId) setPeerTyping(null);
        return;
      }
      setPeerTyping(payload.userName || 'Someone');
      if (stopRef.current) clearTimeout(stopRef.current);
      stopRef.current = setTimeout(() => setPeerTyping(null), 4000);
    };

    channel.bind(RealtimeEvents.TYPING, onTyping);
    return () => {
      channel.unbind(RealtimeEvents.TYPING, onTyping);
      if (stopRef.current) clearTimeout(stopRef.current);
    };
  }, [teamId, chatId]);

  const emitTyping = useCallback(
    (remoteJid: string, isTyping: boolean) => {
      if (!chatId || !remoteJid) return;
      fetch('/api/realtime/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chatId, remoteJid, isTyping }),
      }).catch(() => undefined);
    },
    [chatId]
  );

  const notifyTyping = useCallback(
    (remoteJid: string) => {
      emitTyping(remoteJid, true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => emitTyping(remoteJid, false), 1200);
    },
    [emitTyping]
  );

  return { peerTyping, notifyTyping };
}
