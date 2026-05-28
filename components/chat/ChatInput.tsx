'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Paperclip,
  Mic,
  Send,
  Smile,
  Square,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { EmojiClickData } from 'emoji-picker-react';
import type { QuickReply, RecordingStatus } from './types';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

type Props = {
  isInternalNote: boolean;
  setIsInternalNote: (v: boolean) => void;
  newMessage: string;
  setNewMessage: (v: string) => void;
  recordingStatus: RecordingStatus;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onSendText: () => void;
  onSendAudio: () => void;
  onSendAttachment: (file: File) => void;
  audioUrl: string | null;
  isAudioPlaying: boolean;
  toggleAudioPlayback: () => void;
  audioPlayerRef: React.RefObject<HTMLAudioElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileIconClick: (accept: string) => void;
  onEmojiClick: (data: EmojiClickData) => void;
  quickRepliesOpen: boolean;
  setQuickRepliesOpen: (v: boolean) => void;
  showQuickReplySuggestions: boolean;
  setShowQuickReplySuggestions: (v: boolean) => void;
  filteredQuickReplies: QuickReply[];
  isWindowExpired: boolean;
  onOpenTemplateDialog: () => void;
  isGroup?: boolean;
};

function PopoverEmoji({ onEmojiClick }: { onEmojiClick: (d: EmojiClickData) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen((o) => !o)}>
        <Smile className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2">
          <EmojiPicker onEmojiClick={(d) => { onEmojiClick(d); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

export function ChatInput({
  isInternalNote,
  setIsInternalNote,
  newMessage,
  setNewMessage,
  recordingStatus,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onSendText,
  onSendAudio,
  onSendAttachment,
  audioUrl,
  isWindowExpired,
  onOpenTemplateDialog,
  fileInputRef,
  handleFileIconClick,
  onEmojiClick,
  showQuickReplySuggestions,
  filteredQuickReplies,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendText();
    }
  };

  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch id="internal" checked={isInternalNote} onCheckedChange={setIsInternalNote} />
        <Label htmlFor="internal">Internal note</Label>
      </div>

      {isWindowExpired && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          24h window expired. Send an approved template to re-open.
          <Button variant="link" size="sm" className="h-auto p-0 ml-1" onClick={onOpenTemplateDialog}>
            Templates
          </Button>
        </div>
      )}

      {showQuickReplySuggestions && filteredQuickReplies.length > 0 && (
        <div className="rounded-lg border bg-popover p-1 shadow-md">
          {filteredQuickReplies.map((qr) => (
            <button
              key={qr.id}
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => setNewMessage(qr.message)}
            >
              <span className="font-mono text-primary">/{qr.shortcut}</span> — {qr.message.slice(0, 40)}
            </button>
          ))}
        </div>
      )}

      {recordingStatus === 'recording' && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-sm">
          <span className="animate-pulse text-destructive">Recording {recordingTime}s</span>
          <Button size="sm" variant="outline" onClick={onStopRecording}>
            <Square className="mr-1 h-3 w-3" />
            Stop
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelRecording}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {recordingStatus === 'recorded' && audioUrl && (
        <div className="flex items-center gap-2">
          <audio src={audioUrl} controls className="h-8 flex-1" />
          <Button size="sm" onClick={onSendAudio}>Send audio</Button>
          <Button size="sm" variant="ghost" onClick={onCancelRecording}>Discard</Button>
        </div>
      )}

      {recordingStatus === 'idle' && (
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSendAttachment(file);
              e.target.value = '';
            }}
          />
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => handleFileIconClick('image/*')}>
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => handleFileIconClick('*/*')}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <PopoverEmoji onEmojiClick={onEmojiClick} />
          </div>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInternalNote ? 'Internal note…' : 'Type a message…'}
            className="min-h-[44px] max-h-32 flex-1 resize-none"
            disabled={isWindowExpired && !isInternalNote}
          />
          {newMessage.trim() ? (
            <Button type="button" size="icon" onClick={onSendText}>
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" size="icon" variant="secondary" onClick={onStartRecording}>
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
