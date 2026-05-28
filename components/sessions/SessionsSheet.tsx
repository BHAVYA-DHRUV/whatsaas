'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Activity, Bot, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

type SessionRow = {
  id: number;
  status: string;
  chatId?: number;
  contactName?: string;
  remoteJid?: string;
  startedAt?: string;
};

type SessionsSheetProps = {
  type: 'ai' | 'automation';
};

export function SessionsSheet({ type }: SessionsSheetProps) {
  const [open, setOpen] = useState(false);
  const endpoint = type === 'ai' ? '/api/sessions/ai' : '/api/sessions/automation';
  const { data, isLoading, mutate } = useSWR<SessionRow[]>(open ? endpoint : null, fetcher);

  const endSession = async (id: number) => {
    try {
      const res = await fetch(`${endpoint}/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Session ended');
      mutate();
    } catch {
      toast.error('Could not end session');
    }
  };

  const sessions = Array.isArray(data) ? data : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Activity className="h-4 w-4" />
          Active sessions
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {type === 'ai' ? 'AI sessions' : 'Automation sessions'}
          </SheetTitle>
          <SheetDescription>Live conversations currently handled by {type}.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {s.contactName || s.remoteJid || `Chat #${s.chatId}`}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {s.status}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  onClick={() => endSession(s.id)}
                  aria-label="End session"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
