'use client';

import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, RotateCcw, Reply, Pin, Copy, Star, Trash, Edit, Info, Forward, ChevronDown, FileIcon, Mic } from 'lucide-react';
import type { Message } from './types';
import { CustomAudioPlayer } from '@/components/ui/custom-audio-player';
import { parseDateSafe } from '@/lib/inbox/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';

type Props = {
  msg: Message;
  onMediaClick: (id: string) => void;
  onReply: (msg: Message) => void;
  onRetry: (msg: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onForward: (msg: Message) => void;
  onTogglePin: (msg: Message) => void;
  onToggleStar: (msg: Message) => void;
  onShowInfo: (msg: Message) => void;
  onStartEdit: (msg: Message) => void;
  isEditing?: boolean;
  onSaveEdit?: (msgId: string, text: string) => void;
  onCancelEdit?: () => void;
  isPinned: boolean;
  isStarred: boolean;
  searchQuery?: string;
  userBubbleColor?: string;
  contactBubbleColor?: string;
  isGroup?: boolean;
};


const StatusIcon = memo(function StatusIcon({ status }: { status?: string | null }) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === 'sending') return <span className="text-[10px] text-muted-foreground animate-pulse mr-1">sending...</span>;
  if (s === 'sent') return <Check className="w-3 h-3" />;
  if (s === 'delivered') return <CheckCheck className="w-3 h-3" />;
  if (s === 'read') return <CheckCheck className="w-3 h-3 text-blue-500" />;
  if (s === 'failed' || s === 'error') return <span className="text-[10px] text-destructive font-semibold mr-1">failed</span>;
  return null;
});

const formatBubbleTime = (timestamp: string | Date | number): string => {
  if (!timestamp) return '';
  const date = parseDateSafe(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const MessageBubble = memo(function MessageBubble({
  msg,
  onMediaClick,
  onReply,
  onRetry,
  onReact,
  onDelete,
  onForward,
  onTogglePin,
  onToggleStar,
  onShowInfo,
  onStartEdit,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  isPinned,
  isStarred,
  userBubbleColor,
  contactBubbleColor,
  isGroup,
}: Props) {
  const isMe = msg.fromMe;
  const isInternal = msg.isInternal;
  const bubbleStyle = useMemo(() => isMe
    ? { backgroundColor: userBubbleColor }
    : { backgroundColor: contactBubbleColor }, [isMe, userBubbleColor, contactBubbleColor]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const timeText = useMemo(() => {
    if (!mounted) return '';
    return formatBubbleTime(msg.timestamp);
  }, [mounted, msg.timestamp]);

  // Text state for local editing
  const [localText, setLocalText] = useState('');
  useEffect(() => {
    if (isEditing) {
      setLocalText(msg.text || msg.mediaCaption || '');
    }
  }, [isEditing, msg.text, msg.mediaCaption]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const quotedData = useMemo(() => {
    if (!msg.quotedMessageText) return null;
    try {
      return JSON.parse(msg.quotedMessageText);
    } catch (e) {
      // Fallback for plain text
      return { text: msg.quotedMessageText };
    }
  }, [msg.quotedMessageText]);

  const handleScrollToOriginal = () => {
    if (!quotedData?.id) return;
    const el = document.getElementById(`msg-${quotedData.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('animate-highlight-flash');
      setTimeout(() => {
        el.classList.remove('animate-highlight-flash');
      }, 2000);
    } else {
      toast.info('Message is older. Scroll up to find it.');
    }
  };

  const getQuotedTextFallback = (type?: string): string => {
    if (!type) return 'Message';
    if (type === 'imageMessage') return '📷 Photo';
    if (type === 'videoMessage') return '📹 Video';
    if (type === 'audioMessage') return '🎤 Voice note';
    if (type === 'stickerMessage') return '💟 Sticker';
    if (type === 'documentMessage') return '📄 Document';
    if (type === 'locationMessage') return '📍 Location';
    if (type === 'contactMessage') return '👤 Contact';
    return 'Message';
  };

  const renderBody = useMemo(() => {
    if (msg.messageType === 'imageMessage' && msg.mediaUrl) {
      return (
        <button type="button" onClick={() => onMediaClick(msg.id)} className="block max-w-xs overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.mediaUrl} alt="" className="object-cover w-full max-h-64" />
          {msg.mediaCaption && <p className="p-2 text-sm text-left">{msg.mediaCaption}</p>}
        </button>
      );
    }
    if (msg.messageType === 'videoMessage') {
      if (msg.mediaUrl) {
        return (
          <div className="max-w-xs overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
            <video
              src={msg.mediaUrl}
              controls
              preload="metadata"
              className="w-full max-h-64 object-contain rounded-t-lg"
            />
            {msg.mediaCaption && <p className="p-2 text-sm text-foreground text-left">{msg.mediaCaption}</p>}
          </div>
        );
      }
      return (
        <button type="button" onClick={() => onMediaClick(msg.id)} className="text-sm underline">
          Video message
        </button>
      );
    }
    if (msg.messageType === 'stickerMessage' && msg.mediaUrl) {
      return (
        <div className="max-w-[120px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.mediaUrl} alt="Sticker" className="w-full h-auto object-contain" />
        </div>
      );
    }
    if (msg.messageType === 'audioMessage' && msg.mediaUrl) {
      return <CustomAudioPlayer src={msg.mediaUrl} isMe={isMe} />;
    }
    if (msg.messageType === 'deleted') {
      return (
        <p className="text-sm italic text-muted-foreground/80 flex items-center gap-1.5 select-none text-left">
          <span className="opacity-60">🚫</span>
          <span>{isMe ? 'You deleted this message' : 'This message was deleted'}</span>
        </p>
      );
    }
    if (msg.messageType === 'documentMessage') {
      return (
        <a href={msg.mediaUrl ?? '#'} target="_blank" rel="noreferrer" className="text-sm underline flex items-center gap-2 max-w-xs truncate">
          <FileIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{msg.text || 'Document'}</span>
        </a>
      );
    }
    return <p className="text-sm whitespace-pre-wrap wrap-break-word text-left">{msg.text}</p>;
  }, [msg.messageType, msg.mediaUrl, msg.mediaCaption, msg.text, onMediaClick, isMe]);

  const hasError = msg.status === 'error' || msg.status === 'failed' || String(msg.status).toLowerCase() === 'failed' || String(msg.status).toLowerCase() === 'error';
  const isSticker = msg.messageType === 'stickerMessage';

  const handleCopy = () => {
    const textToCopy = msg.text || msg.mediaCaption || '';
    if (!textToCopy) {
      toast.error('No text content to copy');
      return;
    }
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast.success('Text copied to clipboard'))
      .catch(() => toast.error('Failed to copy text'));
  };

  const handleReplyAction = () => onReply(msg);
  const handleForwardAction = () => onForward(msg);
  const handleToggleStarAction = () => onToggleStar(msg);
  const handleTogglePinAction = () => onTogglePin(msg);
  const handleEditAction = () => onStartEdit(msg);
  const handleInfoAction = () => onShowInfo(msg);
  const handleDeleteAction = () => onDelete(msg.id);

  const reactionRow = (
    <div className="flex items-center justify-around px-2 py-1 border-b gap-1">
      {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(msg.id, emoji)}
          className="hover:scale-125 transition-transform text-base p-1 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={msg.messageType === 'deleted'}>
        <div id={`msg-${msg.id}`} className={cn('group/msg flex w-full mb-2', isMe ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'relative max-w-[75%] rounded-2xl px-3 py-2 shadow-sm group/bubble',
              isMe ? 'rounded-br-md' : 'rounded-bl-md',
              isInternal && 'border border-dashed border-amber-400/60 bg-amber-50 dark:bg-amber-950/30',
              !userBubbleColor && !contactBubbleColor && (
                isSticker
                  ? 'bg-transparent text-foreground shadow-none px-0 py-0'
                  : (isMe ? 'bg-primary text-primary-foreground' : 'bg-muted')
              ),
              hasError && 'border border-destructive'
            )}
            style={!isInternal && !isSticker ? bubbleStyle : undefined}
          >
            {/* Hover Chevron Trigger */}
            {!isEditing && msg.messageType !== 'deleted' && (
              <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full bg-background/80 hover:bg-background shadow-xs p-0 text-muted-foreground hover:text-foreground">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isMe ? 'end' : 'start'} className="w-52">
                    {reactionRow}
                    <DropdownMenuItem onClick={handleReplyAction}>
                      <Reply className="mr-2 h-4 w-4" /> Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleForwardAction}>
                      <Forward className="mr-2 h-4 w-4" /> Forward
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleStarAction}>
                      <Star className={cn("mr-2 h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                      <span>{isStarred ? 'Unstar' : 'Star'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleTogglePinAction}>
                      <Pin className={cn("mr-2 h-4 w-4", isPinned && "fill-primary")} />
                      <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                    </DropdownMenuItem>
                    {msg.fromMe && (
                      <DropdownMenuItem onClick={handleEditAction}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Message
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleInfoAction}>
                      <Info className="mr-2 h-4 w-4" /> Message Info
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteAction} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {isEditing ? (
              <div className="flex flex-col gap-1.5 min-w-[220px]">
                <span className="text-[10px] text-primary font-semibold uppercase tracking-wider opacity-90 text-left">
                  Editing Message
                </span>
                <textarea
                  ref={textareaRef}
                  value={localText}
                  onChange={(e) => setLocalText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (localText.trim() && onSaveEdit) {
                        onSaveEdit(msg.id, localText);
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      if (onCancelEdit) onCancelEdit();
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm focus:ring-0 p-0 text-foreground"
                  rows={Math.max(1, localText.split('\n').length)}
                />
                <div className="flex justify-end gap-1.5 text-[9px] opacity-70 border-t pt-1 mt-0.5 select-none">
                  <span>Esc to cancel</span>
                  <span>·</span>
                  <span>Enter to save</span>
                </div>
              </div>
            ) : (
              <>
                {isGroup && !isMe && msg.participantName && (
                  <p className="mb-1 text-xs font-semibold text-primary">{msg.participantName}</p>
                )}

                {quotedData && msg.messageType !== 'deleted' && (
                  <div
                    onClick={handleScrollToOriginal}
                    className="mb-2 p-1.5 px-2.5 rounded-md bg-black/5 dark:bg-white/5 border-l-4 border-primary/70 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between gap-2 text-xs select-none"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-primary truncate">
                        {quotedData.senderName || 'Contact'}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground mt-0.5 truncate">
                        {quotedData.messageType === 'documentMessage' && (
                          <FileIcon className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {quotedData.messageType === 'audioMessage' && (
                          <Mic className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>{quotedData.text || getQuotedTextFallback(quotedData.messageType)}</span>
                      </div>
                    </div>
                    {quotedData.mediaUrl && ['imageMessage', 'videoMessage', 'stickerMessage'].includes(quotedData.messageType) && (
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-muted border">
                        {quotedData.messageType === 'videoMessage' ? (
                          <video src={quotedData.mediaUrl} className="h-full w-full object-cover" />
                        ) : (
                          <img src={quotedData.mediaUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {renderBody}

                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70 select-none">
                  {msg.isEdited && msg.messageType !== 'deleted' && <span className="text-[9px] font-medium mr-1 bg-black/10 dark:bg-white/10 px-1 rounded-sm">Edited</span>}
                  {isStarred && msg.messageType !== 'deleted' && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-0.5" />}
                  {isPinned && msg.messageType !== 'deleted' && <Pin className="w-3 h-3 text-primary rotate-45 mr-0.5" />}
                  {msg.isAi && msg.messageType !== 'deleted' && <span>AI</span>}
                  <span>{timeText}</span>
                  {isMe && <StatusIcon status={msg.status} />}
                </div>

                {msg.reactions && msg.reactions.length > 0 && msg.messageType !== 'deleted' && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.reactions.map((r) => (
                      <span key={r.id} className="rounded-full bg-background/80 px-1.5 text-xs">
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}
                {(msg.status === 'error' || msg.status === 'failed' || String(msg.status).toLowerCase() === 'failed' || String(msg.status).toLowerCase() === 'error') && (
                  <Button variant="ghost" size="sm" className="mt-1 h-7" onClick={() => onRetry(msg)}>
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {reactionRow}
        <ContextMenuItem onClick={handleReplyAction}>
          <Reply className="mr-2 h-4 w-4" /> Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={handleForwardAction}>
          <Forward className="mr-2 h-4 w-4" /> Forward
        </ContextMenuItem>
        <ContextMenuItem onClick={handleToggleStarAction}>
          <Star className={cn("mr-2 h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
          <span>{isStarred ? 'Unstar' : 'Star'}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleTogglePinAction}>
          <Pin className={cn("mr-2 h-4 w-4", isPinned && "fill-primary")} />
          <span>{isPinned ? 'Unpin' : 'Pin'}</span>
        </ContextMenuItem>
        {msg.fromMe && (
          <ContextMenuItem onClick={handleEditAction}>
            <Edit className="mr-2 h-4 w-4" /> Edit Message
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={handleInfoAction}>
          <Info className="mr-2 h-4 w-4" /> Message Info
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDeleteAction} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash className="mr-2 h-4 w-4" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

