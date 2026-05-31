'use client';

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

function StatusIcon({ status }: { status?: string | null }) {
  if (!status || status === 'sent') return <Check className="h-3 w-3" />;
  if (status === 'delivered') return <CheckCheck className="h-3 w-3" />;
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-500" />;
  return null;
}

export function MessageBubble({
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
  const bubbleStyle = isMe
    ? { backgroundColor: userBubbleColor }
    : { backgroundColor: contactBubbleColor };

  const renderBody = () => {
    if (msg.messageType === 'imageMessage' && msg.mediaUrl) {
      return (
        <button type="button" onClick={() => onMediaClick(msg.id)} className="block max-w-xs overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.mediaUrl} alt="" className="max-h-64 w-full object-cover" />
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
    return <p className="whitespace-pre-wrap wrap-break-word text-sm">{msg.text}</p>;
  };

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
          <div className="mb-2 border-l-2 border-primary/50 pl-2 text-xs opacity-80">Reply</div>
        )}
        {renderBody()}
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
          {msg.isAi && <span>AI</span>}
          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isMe && <StatusIcon status={msg.status} />}
        </div>
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {msg.reactions.map((r) => (
              <span key={r.id} className="rounded-full bg-background/80 px-1.5 text-xs">
                {r.emoji}
              </span>
            ))}
          </div>
        )}
        {msg.status === 'error' && (
          <Button variant="ghost" size="sm" className="mt-1 h-7" onClick={() => onRetry(msg)}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
      <div className="ml-1 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReply(msg)}>
          <Reply className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
