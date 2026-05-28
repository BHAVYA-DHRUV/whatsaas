'use client';

import { memo, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bot,
  Calendar,
  History,
  PanelRightClose,
  PanelRightOpen,
  Star,
  Tag,
  User,
  Workflow,
} from 'lucide-react';
import type { ChatDetails } from '@/components/chat/types';
import { fetcher } from '@/components/chat/utils';
import { toast } from 'sonner';

type ContactRow = {
  id: number;
  name: string;
  notes?: string | null;
  funnelStage?: { id: number; name: string; color?: string } | null;
  assignedUser?: { id: number; name: string } | null;
  tags?: { id: number; label: string; color?: string }[];
};

type TimelineItem = {
  id: string;
  type: string;
  label: string;
  at: string;
};

type CrmPanelProps = {
  chatDetails: ChatDetails;
  chatId?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

function CrmPanelInner({ chatDetails, chatId, collapsed, onToggleCollapse }: CrmPanelProps) {
  const jid = chatDetails.remoteJid;
  const { data: contact, mutate } = useSWR<ContactRow | null>(
    jid ? `/api/contacts/by-chat?jid=${encodeURIComponent(jid)}` : null,
    fetcher
  );
  const { data: aiStatus } = useSWR(
    chatId ? `/api/chats/${chatId}/ai-status` : null,
    fetcher
  );
  const { data: session } = useSWR(
    chatId ? `/api/chats/${chatId}/session` : null,
    fetcher
  );

  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const saveNotes = async () => {
    if (!contact?.id) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Notes saved');
      mutate();
    } catch {
      toast.error('Could not save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const timeline: TimelineItem[] = [
    {
      id: 'last',
      type: 'message',
      label: 'Last customer message',
      at: chatDetails.lastCustomerInteraction || '—',
    },
  ];

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center border-l bg-card py-3">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Expand CRM">
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const leadScore = Math.min(100, (contact?.tags?.length ?? 0) * 15 + (contact?.funnelStage ? 40 : 10));

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l bg-card min-h-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">CRM</h3>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Collapse CRM">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{contact?.name || chatDetails.name}</p>
            <p className="text-xs text-muted-foreground truncate">{jid}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {aiStatus?.isActive && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Bot className="h-3 w-3" /> AI active
                </Badge>
              )}
              {session?.hasActiveSession && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Workflow className="h-3 w-3" /> Automation
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> Lead score
            </span>
            <span className="font-semibold">{leadScore}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${leadScore}%` }} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Pipeline
          </p>
          <Badge
            style={
              contact?.funnelStage?.color
                ? { backgroundColor: contact.funnelStage.color, color: '#fff' }
                : undefined
            }
          >
            {contact?.funnelStage?.name || 'No stage'}
          </Badge>
          {contact?.assignedUser && (
            <p className="mt-2 text-sm text-muted-foreground">
              Assigned: <span className="text-foreground">{contact.assignedUser.name}</span>
            </p>
          )}
        </div>

        {contact?.tags && contact.tags.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((t) => (
                <Badge key={t.id} variant="outline" className="text-xs">
                  {t.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Notes
          </p>
          <Textarea
            rows={4}
            placeholder="Add context for your team…"
            defaultValue={contact?.notes ?? ''}
            onChange={(e) => setNotesDraft(e.target.value)}
            className="text-sm"
          />
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={saveNotes}
            disabled={savingNotes || !contact?.id}
          >
            Save notes
          </Button>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
            <History className="h-3 w-3" /> Timeline
          </p>
          <ul className="space-y-2">
            {timeline.map((item) => (
              <li key={item.id} className="flex gap-2 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.at}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export const CrmPanel = memo(CrmPanelInner);
