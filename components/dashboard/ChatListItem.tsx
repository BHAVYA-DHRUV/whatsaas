'use client';

import { memo, useMemo } from 'react';
import { Pin, BellOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  formatChatListTime,
  getChatDisplayName,
  getChatInitials,
  isContactOnline,
} from '@/lib/inbox/utils';
import { LiveTimestamp } from '@/components/inbox/LiveTimestamp';

export type Agent = {
  id: number;
  name: string;
  email?: string;
  image?: string;
};

export type FunnelStage = {
  id: number;
  name: string;
  color?: string;
};

export type TagData = {
  id: number;
  name?: string;
  label?: string;
  color?: string;
};

export type Contact = {
  id?: number;
  name?: string;
  phone?: string;
  assignedUser?: Agent;
  funnelStage?: FunnelStage;
  tags?: TagData[];
};

export type Chat = {
  id: number;
  teamId?: number;
  remoteJid: string;
  instanceId?: number;
  name?: string;
  pushName?: string;
  profilePicUrl?: string | null;
  lastMessage?: string;
  lastMessageText?: string | null;
  lastMessageTimestamp?: string | null;
  lastCustomerInteraction?: string | null;
  lastMessageFromMe?: boolean;
  lastMessageStatus?: string | null;
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  pinnedAt?: string | null;
  hasStarred?: boolean;
  hasMedia?: boolean;
  createdAt?: string;
  updatedAt?: string;
  contact?: Contact;
};

export type InstanceData = {
  dbId: number;
  instanceName: string;
  integration?: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS' | string;
};

type ChatListItemProps = {
  chat: Chat;
  isActive?: boolean;
  instances?: InstanceData[];
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (chatId: number) => void;
  isMuted?: boolean;
};

export const ChatListItem = memo(function ChatListItem({
  chat,
  isActive = false,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  isMuted = false,
}: ChatListItemProps) {
  // Depend only on name-related fields — not the full chat object.
  // This prevents recalculation when unreadCount/lastMessage change.
  const displayName = useMemo(
    () => getChatDisplayName(chat),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat.name, chat.pushName, chat.remoteJid, chat.contact?.name, chat.contact?.phone]
  );
  const preview = useMemo(() => chat.lastMessage || chat.lastMessageText || 'No messages yet', [chat.lastMessage, chat.lastMessageText]);
  const online = useMemo(() => isContactOnline(chat.lastCustomerInteraction), [chat.lastCustomerInteraction]);
  const unread = chat.unreadCount ?? 0;

  return (
    <div
      onClick={() => {
        if (isSelectionMode && onSelect) onSelect(chat.id);
      }}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors duration-150',
        isActive
          ? 'bg-primary/8 border-l-[3px] border-l-primary'
          : 'hover:bg-muted/50 border-l-[3px] border-l-transparent',
        isSelected && 'ring-2 ring-inset ring-primary/30'
      )}
    >
      <div className="relative shrink-0">
        <Avatar className={cn('h-12 w-12', isActive && 'ring-2 ring-primary/30')}>
          <AvatarImage src={chat.profilePicUrl ?? undefined} alt={displayName} className="object-cover" />
          <AvatarFallback
            className={cn(
              'text-xs font-bold',
              isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {getChatInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {online && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className={cn('truncate text-sm font-semibold', unread > 0 && 'text-foreground')}>
              {displayName}
            </h3>
            {chat.isPinned && <Pin className="h-3 w-3 shrink-0 text-muted-foreground rotate-45" />}
            {isMuted && <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" />}
          </div>
          {chat.lastMessageTimestamp && (
            <LiveTimestamp
              timestamp={chat.lastMessageTimestamp}
              formatFn={formatChatListTime}
              className={cn(
                'shrink-0 text-[11px]',
                unread > 0 ? 'font-semibold text-primary' : 'text-muted-foreground'
              )}
            />
          )}
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              'truncate text-xs',
              unread > 0 ? 'font-medium text-foreground/80' : 'text-muted-foreground'
            )}
          >
            {chat.lastMessageFromMe && !unread ? (
              <span className="text-muted-foreground">You: </span>
            ) : null}
            {preview}
          </p>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export function ChatListSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-3 py-3">
      <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="h-3 w-48 rounded bg-muted" />
      </div>
    </div>
  );
}
