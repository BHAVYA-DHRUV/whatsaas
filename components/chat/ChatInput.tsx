'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Plus,
  Camera,
  Image as ImageIcon,
  FileText,
  Headphones,
  User,
  MapPin,
  Mic,
  Send,
  Smile,
  Square,
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
  onSendLocation?: () => void;
  onShareContact?: () => void;
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

const PopoverAttachment = memo(function PopoverAttachment({
  handleFileIconClick,
  onSendLocation,
  onShareContact
}: {
  handleFileIconClick: (accept: string) => void;
  onSendLocation?: () => void;
  onShareContact?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        className={cn("h-9 w-9 rounded-full transition-transform duration-200 hover:bg-muted", open && "rotate-45 text-primary bg-muted")}
      >
        <Plus className="h-5 w-5" />
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-3 w-52 rounded-2xl border bg-popover p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => { handleFileIconClick('image/*,video/*'); setOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Photos & Videos</span>
            </button>

            <button
              type="button"
              onClick={() => { handleFileIconClick('image/*;capture=camera'); setOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-white">
                <Camera className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Camera</span>
            </button>

            <button
              type="button"
              onClick={() => { handleFileIconClick('.pdf,.doc,.docx,.xls,.xlsx,.txt'); setOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-white">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Document</span>
            </button>

            <button
              type="button"
              onClick={() => { handleFileIconClick('audio/*'); setOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white">
                <Headphones className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Audio</span>
            </button>

            <button
              type="button"
              onClick={() => { if (onShareContact) onShareContact(); setOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white">
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Contact</span>
            </button>

            <button
              type="button"
              onClick={() => { if (onSendLocation) onSendLocation(); setOpen(false); }}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Location</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const PopoverEmoji = memo(function PopoverEmoji({ onEmojiClick }: { onEmojiClick: (d: EmojiClickData) => void }) {
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
});

export const ChatInput = memo(function ChatInput({
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
  onSendLocation,
  onShareContact,
  audioUrl,
  isWindowExpired,
  onOpenTemplateDialog,
  fileInputRef,
  handleFileIconClick,
  onEmojiClick,
  showQuickReplySuggestions,
  filteredQuickReplies,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current && !isWindowExpired) {
      inputRef.current.focus();
    }
  }, [isInternalNote, isWindowExpired]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendText();
    }
  }, [onSendText]);

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
          <div className="flex gap-1 items-center">
            <PopoverAttachment
              handleFileIconClick={handleFileIconClick}
              onSendLocation={onSendLocation}
              onShareContact={onShareContact}
            />
            <PopoverEmoji onEmojiClick={onEmojiClick} />
          </div>
          <Textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInternalNote ? 'Internal note…' : 'Type a message…'}
            className="min-h-[44px] max-h-32 flex-1 resize-none"
            disabled={isWindowExpired && !isInternalNote}
            autoFocus
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
});
