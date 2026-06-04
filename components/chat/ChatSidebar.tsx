'use client';

import { memo } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Download, PanelRightClose, PanelRightOpen, User } from 'lucide-react';
import type { ChatDetails } from './types';
import { fetcher } from './utils';

type Props = {
  chatDetails: ChatDetails;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isGroup?: boolean;
  onSyncMessages?: () => void;
  isSyncingMessages?: boolean;
};

export const ChatSidebar = memo(function ChatSidebar({
  chatDetails,
  isCollapsed,
  onToggleCollapse,
  onSyncMessages,
  isSyncingMessages,
}: Props) {
  const jid = chatDetails.remoteJid;
  const { data: contact } = useSWR(
    jid ? `/api/contacts/by-chat?jid=${encodeURIComponent(jid)}` : null,
    fetcher
  );

  if (isCollapsed) {
    return (
      <div className="flex w-12 flex-col items-center border-l py-3">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className={cn('flex w-80 flex-col border-l bg-card')}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Contact</h3>
        <Button variant="ghost" size="icon" onClick={onToggleCollapse}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{contact?.name || chatDetails.name}</p>
            <p className="text-xs text-muted-foreground truncate">{contact?.phone || jid}</p>
          </div>
        </div>
        {contact?.notes && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}
        {onSyncMessages && (
          <Button variant="outline" size="sm" className="w-full" onClick={onSyncMessages} disabled={isSyncingMessages}>
            <Download className="mr-2 h-4 w-4" />
            Sync messages
          </Button>
        )}
      </div>
    </aside>
  );
});
