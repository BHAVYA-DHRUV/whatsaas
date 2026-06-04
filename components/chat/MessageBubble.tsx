'use client';

import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, RotateCcw, Reply } from 'lucide-react';
import type { Message } from './types';
import { CustomAudioPlayer } from '@/components/ui/custom-audio-player';

type Props = {
  msg: Message;
  onMediaClick: (id: string) => void;
  onReply: (msg: Message) => void;
  onRetry: (msg: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  searchQuery?: string;
  userBubbleColor?: string;
  contactBubbleColor?: string;
  isGroup?: boolean;
};

const StatusIcon = memo(function StatusIcon({ status }: { status?: string | null }) {
  if (!status || status === 'sent') return <Check className="w-3 h-3" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3" />;
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-500" />;
  return null;
});

const formatBubbleTime = (timestamp: string | Date | number): string => {
  if (!timestamp) return '';
  let date: Date;
  
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    if (!trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.includes('-') && !trimmed.includes('GMT')) {
      const formatted = trimmed.replace(' ', 'T');
      date = new Date(formatted.includes('T') ? `${formatted}Z` : `${formatted}T00:00:00Z`);
    } else {
      date = new Date(trimmed);
    }
  } else {
    date = new Date(timestamp);
  }
  
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble = memo(function MessageBubble({
  msg,
  onMediaClick,
  onReply,
  onRetry,
  userBubbleColor,
  contactBubbleColor,
  isGroup,
}: Props) {
  const isMe = msg.fromMe;
  const isInternal = msg.isInternal;
  const bubbleStyle = useMemo(() => isMe
    ? { backgroundColor: userBubbleColor }
    : { backgroundColor: contactBubbleColor }, [isMe, userBubbleColor, contactBubbleColor]);

  const renderBody = useMemo(() => {
    if (msg.messageType === 'imageMessage' && msg.mediaUrl) {
      return (
        <button type="button" onClick={() => onMediaClick(msg.id)} className="block max-w-xs overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.mediaUrl} alt="" className="object-cover w-full max-h-64" />
          {msg.mediaCaption && <p className="p-2 text-sm">{msg.mediaCaption}</p>}
        </button>
      );
    }
    if (msg.messageType === 'videoMessage' && msg.mediaUrl) {
      return (
        <button type="button" onClick={() => onMediaClick(msg.id)} className="text-sm underline">
          Video message
        </button>
      );
    }
    if (msg.messageType === 'audioMessage' && msg.mediaUrl) {
      return <CustomAudioPlayer src={msg.mediaUrl} isMe={isMe} />;
    }
    if (msg.messageType === 'documentMessage') {
      return (
        <a href={msg.mediaUrl ?? '#'} target="_blank" rel="noreferrer" className="text-sm underline">
          {msg.text || 'Document'}
        </a>
      );
    }
    return <p className="text-sm whitespace-pre-wrap wrap-break-word">{msg.text}</p>;
  }, [msg.messageType, msg.mediaUrl, msg.mediaCaption, msg.text, onMediaClick, isMe]);

  return (
    <div className={cn('group flex w-full mb-2', isMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-3 py-2 shadow-sm',
          isMe ? 'rounded-br-md' : 'rounded-bl-md',
          isInternal && 'border border-dashed border-amber-400/60 bg-amber-50 dark:bg-amber-950/30',
          !userBubbleColor && !contactBubbleColor && (isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'),
          msg.status === 'error' && 'border border-destructive'
        )}
        style={!isInternal ? bubbleStyle : undefined}
      >
        {isGroup && !isMe && msg.participantName && (
          <p className="mb-1 text-xs font-semibold text-primary">{msg.participantName}</p>
        )}
        {msg.quotedMessageText && (
          <div className="pl-2 mb-2 text-xs border-l-2 border-primary/50 opacity-80">Reply</div>
        )}
        {renderBody}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
          {msg.isAi && <span>AI</span>}
          <span>{formatBubbleTime(msg.timestamp)}</span>
          {isMe && <StatusIcon status={msg.status} />}
        </div>
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.reactions.map((r) => (
              <span key={r.id} className="rounded-full bg-background/80 px-1.5 text-xs">
                {r.emoji}
              </span>
            ))}
          </div>
        )}
        {msg.status === 'error' && (
          <Button variant="ghost" size="sm" className="mt-1 h-7" onClick={() => onRetry(msg)}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
      <div className="ml-1 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReply(msg)}>
          <Reply className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
});
