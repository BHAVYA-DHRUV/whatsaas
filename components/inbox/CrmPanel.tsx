'use client';

import { memo, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  PanelRightClose,
  PanelRightOpen,
  Settings2,
  Tag,
} from 'lucide-react';
import type { ChatDetails } from '@/components/chat/types';
import { fetcher } from '@/components/chat/utils';
import { getChatInitials } from '@/lib/inbox/utils';
import { toast } from 'sonner';

type ContactRow = {
  id: number;
  name: string;
  phone?: string | null;
  notes?: string | null;
  funnelStage?: { id: number; name: string; color?: string | null } | null;
  assignedUser?: { id: number; name: string } | null;
  tags?: { id: number; name: string; color?: string | null }[];
};

type FunnelStage = { id: number; name: string; color?: string | null };
type TeamMember = { user: { id: number; name: string | null; email: string } };

type CrmPanelProps = {
  chatDetails: ChatDetails;
  chatId?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const TAG_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  gray: 'bg-muted text-muted-foreground',
};

function tagClass(color?: string | null) {
  if (!color) return TAG_COLORS.gray;
  return TAG_COLORS[color] ?? TAG_COLORS.gray;
}

function CrmPanelInner({ chatDetails, chatId, collapsed, onToggleCollapse }: CrmPanelProps) {
  const jid = chatDetails.remoteJid;
  const displayName = chatDetails.name;
  const phone = chatDetails.phone || (jid ? jid.split('@')[0] : '');

  const { data: contact, mutate } = useSWR<ContactRow | null>(
    jid ? `/api/contacts/by-chat?jid=${encodeURIComponent(jid)}` : null,
    fetcher
  );
  const { data: aiStatus, mutate: mutateAi } = useSWR(
    chatId ? `/api/chats/${chatId}/ai-status` : null,
    fetcher
  );
  const { data: team } = useSWR<{ teamMembers?: TeamMember[] }>('/api/team', fetcher);
  const { data: funnelStages } = useSWR<FunnelStage[]>('/api/funnel-stages', fetcher);

  const [assignOpen, setAssignOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const members = team?.teamMembers ?? [];
  const aiActive = aiStatus?.isActive === true;

  const updateFunnelStage = async (stageId: string) => {
    if (!contact?.id) return;
    setActionLoading('stage');
    try {
      const res = await fetch(`/api/contacts/${contact.id}/funnel-stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: stageId === 'none' ? null : parseInt(stageId, 10) }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Funnel stage updated');
      mutate();
    } catch {
      toast.error('Could not update stage');
    } finally {
      setActionLoading(null);
    }
  };

  const assignAgent = async (agentId: string) => {
    if (!contact?.id) return;
    setActionLoading('assign');
    try {
      const res = await fetch(`/api/contacts/${contact.id}/assign-agent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentId === 'none' ? null : agentId }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Agent assigned');
      mutate();
      setAssignOpen(false);
    } catch {
      toast.error('Could not assign agent');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAi = async () => {
    if (!chatId) return;
    setActionLoading('ai');
    const next = aiActive ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/chats/${chatId}/ai-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(aiActive ? 'AI paused' : 'AI activated');
      mutateAi();
    } catch {
      toast.error('Could not update AI status');
    } finally {
      setActionLoading(null);
    }
  };

  if (collapsed) {
    return (
      <div className="hidden lg:flex w-12 flex-col items-center border-l bg-card py-3">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} aria-label="Expand CRM">
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="hidden lg:flex w-[300px] xl:w-[320px] shrink-0 flex-col border-l bg-card min-h-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleCollapse} aria-label="Collapse CRM">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Profile */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3 ring-2 ring-border">
            <AvatarImage src={chatDetails.profilePicUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {getChatInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <h4 className="font-semibold text-lg">{contact?.name || displayName}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{phone}</p>
        </div>

        {/* Funnel stage */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Funnel Stage
          </p>
          <Select
            value={contact?.funnelStage?.id?.toString() ?? 'none'}
            onValueChange={updateFunnelStage}
            disabled={!contact?.id || actionLoading === 'stage'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select stage">
                {contact?.funnelStage ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: contact.funnelStage.color || '#eab308' }}
                    />
                    {contact.funnelStage.name}
                  </span>
                ) : (
                  'No stage'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No stage</SelectItem>
              {(funnelStages || []).map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.color || '#888' }}
                    />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        {contact?.tags && contact.tags.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((t) => (
                <Badge key={t.id} variant="secondary" className={`text-xs font-medium ${tagClass(t.color)}`}>
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {assignOpen ? (
            <Select
              onValueChange={assignAgent}
              disabled={!contact?.id || actionLoading === 'assign'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose agent…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.user.id} value={m.user.id.toString()}>
                    {m.user.name || m.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setAssignOpen(true)}
              disabled={!contact?.id}
            >
              <Settings2 className="h-4 w-4" />
              {contact?.assignedUser ? `Assigned: ${contact.assignedUser.name}` : 'Assign Agent'}
            </Button>
          )}

          <Button
            variant={aiActive ? 'secondary' : 'outline'}
            className="w-full justify-start gap-2"
            onClick={toggleAi}
            disabled={!chatId || actionLoading === 'ai'}
          >
            <Bot className="h-4 w-4" />
            {aiActive ? 'Pause AI' : 'Enable AI'}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export const CrmPanel = memo(CrmPanelInner);
