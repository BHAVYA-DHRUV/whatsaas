'use client';

import React from 'react';
import {
  MessageCircle,
  Clock,
  User2,
  CheckCheck,
  BellOff,
} from 'lucide-react';

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
  label: string;
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

  lastMessage?: string;

  lastMessageTimestamp?: string;

  lastMessageFromMe?: boolean;

  unreadCount?: number;

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

  agents?: Agent[];

  funnelStages?: FunnelStage[];

  tags?: TagData[];

  onContactUpdate?: (
    updater?: (currentChats: Chat[]) => Chat[]
  ) => void;

  isMuted?: boolean;

  onToggleMute?: () => void;
};

export function ChatListItem({
  chat,
  isActive = false,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  isMuted = false,
}: ChatListItemProps) {
  const formattedTime = chat.lastMessageTimestamp
    ? new Date(chat.lastMessageTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      onClick={() => {
        if (isSelectionMode && onSelect) {
          onSelect(chat.id);
        }
      }}
      className={`
        relative flex items-start gap-3 px-4 py-4 border-b cursor-pointer
        transition-all duration-200
        hover:bg-muted/60
        ${
          isActive
            ? 'bg-primary/10 border-primary/20'
            : 'bg-background border-border'
        }
        ${isSelected ? 'ring-2 ring-primary/40' : ''}
      `}
    >
      {isSelectionMode && (
        <div className="flex items-center pt-1">
          <div
            className={`
              w-5 h-5 rounded border flex items-center justify-center
              ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground'
              }
            `}
          >
            {isSelected && (
              <CheckCheck className="w-3 h-3 text-white" />
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
        <User2 className="w-6 h-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-foreground">
              {chat.name ||
                chat.pushName ||
                chat.contact?.name ||
                chat.remoteJid}
            </h3>

            <div className="flex items-center gap-2 mt-1">
              {chat.contact?.funnelStage && (
                <span
                  className="px-2 py-0.5 text-[10px] rounded-full font-medium"
                  style={{
                    backgroundColor:
                      chat.contact.funnelStage.color || '#e5e7eb',
                    color: '#111827',
                  }}
                >
                  {chat.contact.funnelStage.name}
                </span>
              )}

              {isMuted && (
                <BellOff className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {formattedTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formattedTime}
              </div>
            )}

            {!!chat.unreadCount && chat.unreadCount > 0 && (
              <div className="flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white rounded-full bg-primary">
                {chat.unreadCount}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />

          <p className="text-sm truncate text-muted-foreground">
            {chat.lastMessage || 'No messages yet'}
          </p>
        </div>

        {chat.contact?.assignedUser && (
          <div className="mt-2 text-xs text-muted-foreground">
            Assigned to:{' '}
            <span className="font-medium text-foreground">
              {chat.contact.assignedUser.name}
            </span>
          </div>
        )}

        {chat.contact?.tags &&
          chat.contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {chat.contact.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground"
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-border animate-pulse">
      <div className="w-12 h-12 rounded-full bg-muted" />

      <div className="flex-1">
        <div className="w-40 h-4 rounded bg-muted" />

        <div className="w-56 h-3 mt-3 rounded bg-muted" />

        <div className="w-20 h-3 mt-3 rounded bg-muted" />
      </div>
    </div>
  );
}