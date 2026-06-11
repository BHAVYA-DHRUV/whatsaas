'use client';

import dynamic from 'next/dynamic';
import React, { useDeferredValue, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, Pin, PanelRightOpen, Download, FileIcon, Mic } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useParams, useSearchParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { getTeamChannel } from '@/lib/pusher-client';
import { toast } from 'sonner';
import { EmojiClickData } from 'emoji-picker-react';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import { useTypingIndicator } from '@/lib/realtime/use-typing-indicator';
import { getChatDisplayName, sortConversationsByLatestActivity, parseDateSafe } from '@/lib/inbox/utils';
import { useChatMessages } from '@/lib/hooks/use-chat-messages';
import { Chat } from '@/lib/db/schema';
import { Message, Reaction, QuickReply, NewMessagePayload, ChatDetails, ContactData, TeamData, RecordingStatus } from '@/components/chat/types';
import { fetcher, isSameDay, formatDateSeparator } from '@/components/chat/utils';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useVirtualizer } from '@tanstack/react-virtual';

const CrmPanel = dynamic(
  () => import('@/components/inbox/CrmPanel').then((m) => m.CrmPanel),
  { ssr: false, loading: () => <div className="hidden lg:block w-[320px] shrink-0 border-l bg-card" /> }
);
const TemplateDialog = dynamic(
  () => import('@/components/chat/TemplateDialog').then((m) => m.TemplateDialog),
  { ssr: false }
);
const QuickRepliesModal = dynamic(
  () => import('@/components/chat/QuickRepliesModal').then((m) => m.QuickRepliesModal),
  { ssr: false }
);
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { DateSeparator } from '@/components/chat/DateSeparator';

interface ChatThemeData {
  backgroundType: string;
  backgroundColor: string;
  backgroundImageUrl: string | null;
  userBubbleColor: string;
  contactBubbleColor: string;
  darkBackgroundColor: string;
  darkUserBubbleColor: string;
  darkContactBubbleColor: string;
}

function jidsMatch(jid1: string | null | undefined, jid2: string | null | undefined): boolean {
  if (!jid1 || !jid2) return false;
  if (jid1 === jid2) return true;
  const isGroup1 = jid1.endsWith('@g.us');
  const isGroup2 = jid2.endsWith('@g.us');
  if (isGroup1 !== isGroup2) return false;
  if (isGroup1) return jid1 === jid2;
  return jid1.split('@')[0] === jid2.split('@')[0];
}

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

function formatPhoneNumber(remoteJid: string): string {
  const num = remoteJid.split('@')[0];
  if (/^\d+$/.test(num)) {
    if (num.startsWith('91') && num.length === 12) return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
    return `+${num}`;
  }
  return num;
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawJid = params.jid as string;
  const chatNumber = rawJid ? decodeURIComponent(rawJid) : rawJid;
  const instanceIdParam = searchParams.get('instanceId');
  const messageIdParam = searchParams.get('messageId');

  const isGroup = chatNumber ? chatNumber.endsWith('@g.us') : false;
  const remoteJid = chatNumber
    ? (isGroup ? chatNumber : `${chatNumber}@s.whatsapp.net`)
    : null;

  const activeChatRef = useRef<Chat | undefined>(undefined);

  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);
  const [syncDismissed, setSyncDismissed] = useState(false);
  const [customerPresence, setCustomerPresence] = useState<'composing' | 'recording' | 'available' | 'unavailable' | null>(null);
  const presenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [showQuickReplySuggestions, setShowQuickReplySuggestions] = useState(false);
  const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Message options states
  const [pinnedMessageIds, setPinnedMessageIds] = useState<{ id: string; text: string; timestamp: string }[]>([]);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [infoMessage, setInfoMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');

  useEffect(() => {
    if (remoteJid) {
      const p = localStorage.getItem(`pinned_${remoteJid}`);
      try {
        if (p) setPinnedMessageIds(JSON.parse(p)); else setPinnedMessageIds([]);
      } catch (e) {
        setPinnedMessageIds([]);
      }
    }
  }, [remoteJid]);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('chatSidebarCollapsed');
    if (saved === 'true') {
      setChatSidebarCollapsed(true);
    }
  }, []);

  const toggleChatSidebar = useCallback(() => {
    setChatSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('chatSidebarCollapsed', String(next));
      return next;
    });
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesMainRef = useRef<HTMLElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = useTranslations('Chat');

  const { data: teamData } = useSWR<TeamData>('/api/team', fetcher);
  const { data: chatTheme } = useSWR<ChatThemeData>('/api/chat-theme', fetcher);
  const teamId = teamData?.id;

  const activeThemeBg = chatTheme ? (isDark ? chatTheme.darkBackgroundColor : chatTheme.backgroundColor) : undefined;
  const activeUserBubble = chatTheme ? (isDark ? chatTheme.darkUserBubbleColor : chatTheme.userBubbleColor) : undefined;
  const activeContactBubble = chatTheme ? (isDark ? chatTheme.darkContactBubbleColor : chatTheme.contactBubbleColor) : undefined;
  
  const { data: chats } = useSWR<Chat[]>(
    '/api/chats',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 10_000,
      keepPreviousData: true,
    }
  );

  const currentChat = useMemo(() => {
      if (!chats || !remoteJid) return undefined;
      if (instanceIdParam) {
          const exactMatch = chats.find(c => jidsMatch(c.remoteJid, remoteJid) && c.instanceId === parseInt(instanceIdParam));
          if (exactMatch) return exactMatch;
      }

      return chats.find(c => jidsMatch(c.remoteJid, remoteJid));
  }, [chats, remoteJid, instanceIdParam]);

  const { peerTyping, notifyTyping } = useTypingIndicator(teamId, currentChat?.id);

  const messagesBaseKey = useMemo(() => {
      if (!remoteJid) return null;
      
      if (instanceIdParam) {
          return `/api/messages?jid=${remoteJid}&instanceId=${instanceIdParam}`;
      }
      if (currentChat?.id) {
           return `/api/messages?chatId=${currentChat.id}`;
      }

      return `/api/messages?jid=${remoteJid}`;
  }, [remoteJid, instanceIdParam, currentChat]);

  const {
    messages,
    error,
    isLoading,
    mutateMessages,
    loadOlder,
    loadingOlder,
    hasMore: hasMoreMessages,
    resetPagination,
  } = useChatMessages(messagesBaseKey);

  const starredMessageIds = useMemo(() => {
    if (!messages) return [];
    return messages.filter(m => m.isStarred).map(m => m.id);
  }, [messages]);

  const sortedChats = useMemo(() => {
    if (!chats) return [];
    return sortConversationsByLatestActivity(chats);
  }, [chats]);

  const filteredForwardChats = useMemo(() => {
    const query = forwardSearch.toLowerCase().trim();
    if (!query) return sortedChats;
    
    // Normalize query for symbol-stripping (like the main search)
    const normalizedQuery = query.replace(/[-_.+()[\]{}]/g, '').replace(/\s+/g, ' ');
    const isPhoneQuery = /^\d+$/.test(query.replace(/\D/g, ''));
    const phoneDigits = query.replace(/\D/g, '');

    return sortedChats.filter(chat => {
      const displayName = getChatDisplayName(chat).toLowerCase();
      const phone = chat.remoteJid.split('@')[0];
      const formattedPhone = formatPhoneNumber(chat.remoteJid).toLowerCase();
      const normalizedDisplayName = displayName.replace(/[-_.+()[\]{}]/g, '').replace(/\s+/g, ' ');
      
      // Phone number matching (partial digit matching)
      if (isPhoneQuery && phoneDigits) {
        const normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone.includes(phoneDigits)) return true;
      }
      
      // Text matching with symbol normalization
      return normalizedDisplayName.includes(normalizedQuery) || 
             phone.includes(query) || 
             formattedPhone.includes(query) || 
             chat.remoteJid.toLowerCase().includes(query);
    });
  }, [sortedChats, forwardSearch]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredForwardChats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
  });

  useEffect(() => {
    resetPagination();
  }, [messagesBaseKey, resetPagination]);
  
  const { data: contact, mutate: mutateContact } = useSWR<ContactData | null>(
    remoteJid ? `/api/contacts/by-chat?jid=${remoteJid}` : null,
    fetcher
  );
  
  useEffect(() => {
    activeChatRef.current = currentChat;
    if (currentChat?.id) (window as any).__activeChatId = currentChat.id;
  }, [currentChat]);

  const { data: instances } = useSWR<any[]>('/api/instance/details', fetcher);
  const activeInstance = Array.isArray(instances) ? instances.find(i => i.dbId === currentChat?.instanceId) : undefined;
  const { data: quickReplies } = useSWR<QuickReply[]>('/api/quick-replies', fetcher);

  const mediaMessages = useMemo(() => {
    if (!messages) return [];
    return messages.filter(msg => (msg.messageType === 'imageMessage' || msg.messageType === 'videoMessage') && msg.mediaUrl);
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    
    const unique: Message[] = [];
    const ids = new Set<string>();
    
    for (const msg of messages) {
      if (!msg.id || ids.has(msg.id)) continue;
      
      const isDup = unique.some(existing => {
        if (existing.id === msg.id) return true;
        const timeA = new Date(existing.timestamp).getTime();
        const timeB = new Date(msg.timestamp).getTime();
        return (
          existing.fromMe === msg.fromMe &&
          existing.text === msg.text &&
          Math.abs(timeA - timeB) < 2000
        );
      });
      
      if (isDup) continue;
      
      ids.add(msg.id);
      unique.push(msg);
    }
    
    if (!deferredSearchQuery.trim()) return unique;
    return unique.filter(msg =>
      msg.text?.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
      msg.mediaCaption?.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
      (msg.messageType === 'documentMessage' && msg.text?.toLowerCase().includes(deferredSearchQuery.toLowerCase()))
    );
  }, [messages, deferredSearchQuery]);

  const slides = useMemo(() => {
    return mediaMessages.map(msg => {
      if (msg.messageType === 'videoMessage' && msg.mediaUrl) {
        return {
          type: "video" as const,
          width: 1280,
          height: 720,
          sources: [{ src: msg.mediaUrl, type: "video/mp4" }]
        };
      }
      return { type: "image" as const, src: msg.mediaUrl! };
    });
  }, [mediaMessages]);

  const filteredQuickReplies = useMemo(() => {
    if (!newMessage.startsWith('/') || !quickReplies) return [];
    const search = newMessage.slice(1).toLowerCase();
    return quickReplies.filter(r => r.shortcut.toLowerCase().startsWith(search));
  }, [newMessage, quickReplies]);

  const handleMediaClick = (messageId: string) => {
    const clickedIndex = mediaMessages.findIndex(msg => msg.id === messageId);
    if (clickedIndex !== -1) { setLightboxIndex(clickedIndex); setLightboxOpen(true); }
  };

  const chatDetailsName = useMemo(() => {
    return getChatDisplayName({
      name: currentChat?.name || undefined,
      pushName: currentChat?.pushName || undefined,
      contact: contact || undefined,
      remoteJid: remoteJid || '',
    });
  }, [contact, currentChat, remoteJid]);

  const chatDetails: ChatDetails = {
    remoteJid: remoteJid,
    name: chatDetailsName,
    profilePicUrl: currentChat?.profilePicUrl || null,
    lastCustomerInteraction: currentChat?.lastCustomerInteraction ? new Date(currentChat.lastCustomerInteraction).toISOString() : null,
    integration: activeInstance?.integration || 'WHATSAPP-BAILEYS',
    phone: contact?.phone || (chatNumber && !isGroup ? chatNumber : null),
  };

  const isWaba = activeInstance?.integration === 'WHATSAPP-BUSINESS';
  const isWindowExpired = useMemo(() => {
    if (!isWaba) return false;
    if (!currentChat?.lastCustomerInteraction) return true;
    const start = new Date(currentChat.lastCustomerInteraction).getTime();
    const now = Date.now();
    return (now - start) > 24 * 60 * 60 * 1000;
  }, [isWaba, currentChat?.lastCustomerInteraction]);


  const handleMessagesScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop > 120 || !hasMoreMessages || loadingOlder) return;
      const prevHeight = el.scrollHeight;
      void loadOlder().then(() => {
        requestAnimationFrame(() => {
          const main = messagesMainRef.current;
          if (main) main.scrollTop = main.scrollHeight - prevHeight;
        });
      });
    },
    [hasMoreMessages, loadingOlder, loadOlder]
  );

  // Both refs must be declared before the effects that reference them
  const prevIsLoadingRef = useRef(true);
  const isFirstLoadRef = useRef(true);

  // Reset first-load flag AND the loading ref whenever the chat changes
  useEffect(() => {
    isFirstLoadRef.current = true;
    prevIsLoadingRef.current = true;  // mark: expect a loading→loaded transition
  }, [remoteJid]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (deferredSearchQuery || messageIdParam || !messages || messages.length === 0) return;
    const timer = setTimeout(() => {
      if (isFirstLoadRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isFirstLoadRef.current = false;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages?.length, rawJid, deferredSearchQuery, messageIdParam]);

  useEffect(() => {
    if (messageIdParam && messages && messages.length > 0) {
      const el = document.getElementById(`msg-${messageIdParam}`);
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('animate-highlight-flash');
          setTimeout(() => {
            el.classList.remove('animate-highlight-flash');
          }, 3000);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [messageIdParam, messages]);

  useEffect(() => {
    setShowQuickReplySuggestions(newMessage.startsWith('/') && filteredQuickReplies.length > 0);
  }, [newMessage, filteredQuickReplies]);

  const { cache: swrCache, mutate: globalMutate } = useSWRConfig();

  const updateChatListCache = useCallback((chatId: number, updates: Partial<Chat>) => {
    const mutateFn = (key: any) => typeof key === 'string' && key.startsWith('/api/chats');
    globalMutate(
      mutateFn,
      (currentChats: any) => {
        if (!Array.isArray(currentChats)) return currentChats;
        const idx = currentChats.findIndex((c: any) => c.id === chatId);
        if (idx === -1) return currentChats;
        const updated = [...currentChats];
        updated[idx] = { 
          ...updated[idx], 
          ...updates,
          lastMessageTimestamp: updates.lastMessageTimestamp || new Date().toISOString()
        };
        // Move updated chat to top for instant visual feedback
        // (InboxShell sortedChats will re-sort by timestamp on next render,
        //  but this gives immediate WhatsApp-style movement to position 0)
        const [item] = updated.splice(idx, 1);
        return [item, ...updated];
      },
      { revalidate: false }
    );
  }, [globalMutate]);

  // Synchronize latest message from messages array to `/api/chats` SWR cache
  useEffect(() => {
    if (!messages || messages.length === 0 || !currentChat?.id) return;
    
    const latestMsg = messages[messages.length - 1];
    if (!latestMsg) return;

    const textPreview = latestMsg.text || latestMsg.mediaCaption || getQuotedTextFallback(latestMsg.messageType || undefined);
    const lastTime = latestMsg.timestamp;
    const lastFromMe = latestMsg.fromMe;
    const lastStatus = latestMsg.status || null;

    // Compare with current values to avoid redundant SWR cache mutations
    if (
      currentChat.lastMessageTimestamp === lastTime &&
      currentChat.lastMessageText === textPreview &&
      currentChat.lastMessageFromMe === lastFromMe &&
      currentChat.lastMessageStatus === lastStatus
    ) {
      return;
    }

    updateChatListCache(currentChat.id, {
      lastMessage: textPreview,
      lastMessageText: textPreview,
      lastMessageTimestamp: lastTime,
      lastMessageFromMe: lastFromMe,
      lastMessageStatus: lastStatus,
    });
  }, [messages, currentChat?.id, currentChat?.lastMessageTimestamp, currentChat?.lastMessageText, currentChat?.lastMessageFromMe, currentChat?.lastMessageStatus, updateChatListCache]);

  useEffect(() => {
    if (!teamId || !remoteJid) return;

    const channel = getTeamChannel(teamId);
    if (!channel) return;

    const handleNewMessage = (payload: NewMessagePayload) => {
      const activeChat = activeChatRef.current;
      const instanceMatch = !activeChat?.instanceId || !payload.instanceId || activeChat.instanceId === payload.instanceId;

      if (jidsMatch(payload.remoteJid, remoteJid) && instanceMatch) {
        mutateMessages((currentMessages = []) => {
          if (currentMessages.some(msg => msg.id === payload.id)) return currentMessages;
          const messageWithStatus = { ...payload, status: payload.status || (payload.fromMe ? 'sent' : null) };
          return [...(currentMessages || []), messageWithStatus as Message];
        }, false);
        setTimeout(() => scrollToBottom(), 150);
      }
    };

    const handleMessageStatusUpdate = (payload: { messageId: string; status: 'sent' | 'delivered' | 'read' }) => {
      mutateMessages((currentMessages = []) => currentMessages.map(msg => msg.id === payload.messageId ? { ...msg, status: payload.status } : msg), false);
    };

    const handleChatStatusUpdate = (payload: { chatId: number; type: 'ai' | 'automation'; status: string }) => {
      const currentId = activeChatRef.current?.id;
      if (currentId && payload.chatId === currentId) {
        if (payload.type === 'ai') globalMutate(`/api/chats/${payload.chatId}/ai-status`);
        if (payload.type === 'automation') globalMutate(`/api/chats/${payload.chatId}/session`);
      }
    };

    const handleMessageReaction = (payload: { messageId: string; chatId: number; emoji: string | null; fromMe: boolean; remoteJid: string | null; participantName: string | null; action: 'add' | 'remove' }) => {
      mutateMessages((currentMessages = []) => currentMessages.map(msg => {
        if (msg.id !== payload.messageId) return msg;
        const currentReactions = msg.reactions || [];
        if (payload.action === 'add' && payload.emoji) {
          const filtered = currentReactions.filter(r => payload.fromMe ? !r.fromMe : r.remoteJid !== payload.remoteJid);
          const newReaction: Reaction = { id: Date.now(), emoji: payload.emoji, fromMe: payload.fromMe, remoteJid: payload.remoteJid, participantName: payload.participantName };
          return { ...msg, reactions: [...filtered, newReaction] };
        } else {
          const filtered = currentReactions.filter(r => payload.fromMe ? !r.fromMe : r.remoteJid !== payload.remoteJid);
          return { ...msg, reactions: filtered };
        }
      }), false);
    };

    const handleContactUpdate = (payload: { remoteJid?: string; chatId?: number }) => {
      const currentId = activeChatRef.current?.id;
      if ((payload.remoteJid && jidsMatch(payload.remoteJid, remoteJid)) || (payload.chatId && currentId && payload.chatId === currentId)) {
        mutateContact();
      }
    };

    const handleChatPresence = (payload: { remoteJid: string; presence: 'composing' | 'recording' | 'available' | 'unavailable'; instance?: string }) => {
      if (jidsMatch(payload.remoteJid, remoteJid)) {
        setCustomerPresence(payload.presence);
        if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
        if (payload.presence === 'composing' || payload.presence === 'recording') {
          presenceTimeoutRef.current = setTimeout(() => {
            setCustomerPresence('available');
          }, 4000);
        }
      }
    };

    const handleRealtimeMessageUpdate = (payload: { messageId: string; updates: Record<string, unknown> }) => {
      mutateMessages((current = []) => current.map(m => m.id === payload.messageId ? { ...m, ...payload.updates } : m), false);
      if (currentChat?.id) {
        updateChatListCache(currentChat.id, {
          ...(payload.updates.text ? { lastMessageText: payload.updates.text as string } : {}),
        });
      }
    };

    const handleRealtimeMessageDelete = (payload: { messageId: string }) => {
      mutateMessages((current = []) => current.map(m => m.id === payload.messageId ? { ...m, messageType: 'deleted', text: 'This message was deleted', mediaUrl: null, mediaMimetype: null, mediaCaption: null, isStarred: false } : m), false);
      if (currentChat?.id) {
        updateChatListCache(currentChat.id, {
          lastMessageText: 'This message was deleted',
        });
      }
    };

    channel.bind('new-message', handleNewMessage);
    channel.bind('message-status-update', handleMessageStatusUpdate);
    channel.bind('message-update', handleRealtimeMessageUpdate);
    channel.bind('message-delete', handleRealtimeMessageDelete);
    channel.bind('chat-status-update', handleChatStatusUpdate);
    channel.bind('message-reaction', handleMessageReaction);
    channel.bind('contact-update', handleContactUpdate);
    channel.bind('chat-presence', handleChatPresence);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      channel.unbind('message-status-update', handleMessageStatusUpdate);
      channel.unbind('message-update', handleRealtimeMessageUpdate);
      channel.unbind('message-delete', handleRealtimeMessageDelete);
      channel.unbind('chat-status-update', handleChatStatusUpdate);
      channel.unbind('message-reaction', handleMessageReaction);
      channel.unbind('contact-update', handleContactUpdate);
      channel.unbind('chat-presence', handleChatPresence);
      if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
    };
  }, [teamId, remoteJid, mutateMessages, mutateContact, scrollToBottom, globalMutate]);

  useEffect(() => {
    if (messages && remoteJid && teamId) {
      if (currentChat && currentChat.unreadCount && currentChat.unreadCount > 0) {
        const mutateFn = (key: any) => typeof key === 'string' && key.startsWith('/api/chats');
        globalMutate(mutateFn, (currentData: Chat[] | undefined = []) => currentData.map(chat => chat.id === currentChat.id ? { ...chat, unreadCount: 0 } : chat), false);
        fetch('/api/chats/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: currentChat.id }), }).catch(err => console.error(err));
      }
    }
  }, [messages, remoteJid, teamId, globalMutate, swrCache, currentChat]);

  const startRecording = async () => {
    if (recordingStatus !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          options = { mimeType: 'audio/ogg;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          options = { mimeType: 'audio/aac' };
        }
      }
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];
      recorder.ondataavailable = (event) => audioChunks.push(event.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: recorder.mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob); setAudioUrl(audioUrl);
        setRecordingStatus('review');
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setRecordingStatus('recording');
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      toast.error("Could not start recording.");
    }
  };

  const stopRecording = () => {
    if (recordingStatus !== 'recording' || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  };

  const cancelRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null); setAudioUrl(null);
    setRecordingStatus('idle'); setRecordingTime(0);
    setIsAudioPlaying(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
  };

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isAudioPlaying) audioPlayerRef.current.pause(); else audioPlayerRef.current.play();
    setIsAudioPlaying(!isAudioPlaying);
  };

  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (audio) {
      const onEnded = () => setIsAudioPlaying(false);
      audio.addEventListener('ended', onEnded);
      return () => audio.removeEventListener('ended', onEnded);
    }
  }, [audioPlayerRef.current]);

  const optimisticUpdateChatList = useCallback((text: string) => {
    if (!currentChat?.id) return;
    const mutateFn = (key: any) => typeof key === 'string' && key.startsWith('/api/chats');
    globalMutate(
      mutateFn,
      (currentChats: any) => {
        if (!Array.isArray(currentChats)) return currentChats;
        const idx = currentChats.findIndex((c: any) => c.id === currentChat.id);
        if (idx === -1) return currentChats;
        const updated = [...currentChats];
        updated[idx] = {
          ...updated[idx],
          lastMessage: text,
          lastMessageText: text,
          lastMessageTimestamp: new Date().toISOString(),
          lastMessageFromMe: true,
        };
        // Move to top
        const [item] = updated.splice(idx, 1);
        return [item, ...updated];
      },
      { revalidate: false }
    );
  }, [currentChat, globalMutate]);

  const sendTextMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !remoteJid) return;
    setRecordingStatus('sending');

    const messageToQuote = quotedMessage;
    let quotedData: any = null;
    if (messageToQuote) {
      quotedData = {
        id: messageToQuote.id,
        text: messageToQuote.text || messageToQuote.mediaCaption || '',
        messageType: messageToQuote.messageType,
        mediaUrl: messageToQuote.mediaUrl || null,
        mediaMimetype: messageToQuote.mediaMimetype || null,
        senderName: messageToQuote.fromMe ? 'You' : (messageToQuote.participantName || 'Contact')
      };
    }
    const tempId = `temp_text_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId, chatId: currentChat?.id || 0, fromMe: true, messageType: 'conversation', text: textToSend, timestamp: new Date().toISOString(),
      mediaUrl: null, mediaMimetype: null, mediaCaption: null, status: 'SENDING',
      quotedMessageId: messageToQuote?.id, quotedMessageText: quotedData ? JSON.stringify(quotedData) : null,
      isInternal: isInternalNote,
      isAi: false, isAutomation: false
    };
    mutateMessages((currentMessages = []) => [...currentMessages, optimisticMessage], false);
    optimisticUpdateChatList(textToSend);
    const timer = setTimeout(() => scrollToBottom(), 100);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            recipientJid: remoteJid, 
            text: textToSend, 
            quotedMessageData: quotedData, 
            isInternal: isInternalNote,
            instanceId: currentChat?.instanceId 
        }),
      });
      const sentMessageData: Message = await response.json();
      if (!response.ok && !sentMessageData.status) throw new Error((sentMessageData as any).error || 'Failed to send message.');
      mutateMessages((currentMessages = []) => currentMessages.map(msg => msg.id === tempId ? { ...sentMessageData, timestamp: new Date(sentMessageData.timestamp).toISOString() } : msg), false);
    } catch (sendError: any) {
      mutateMessages((currentMessages = []) => currentMessages.map(msg => msg.id === tempId ? { ...msg, status: 'error' as const, errorMessage: sendError.message } : msg), false);
      toast.error(`Error sending message: ${sendError.message}`);
    } finally { clearTimeout(timer); setRecordingStatus('idle'); }
  };

  const handleSendText = async () => {
    const text = newMessage;
    if (!text.trim()) return;
    setNewMessage(''); setQuotedMessage(null); setShowQuickReplySuggestions(false);
    await sendTextMessage(text);
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        sendTextMessage(`📍 My Location: ${mapsUrl}`);
      },
      (error) => {
        toast.error(`Error getting location: ${error.message}`);
      }
    );
  };

  const handleShareContact = () => {
    const name = prompt('Enter Contact Name:');
    if (!name) return;
    const phone = prompt('Enter Contact Phone Number:');
    if (!phone) return;
    sendTextMessage(`👤 Contact Card:\nName: ${name}\nPhone: ${phone}`);
  };

  const handleSendAudio = async () => {
    if (!audioBlob || !remoteJid || recordingStatus !== 'review') return;
    setRecordingStatus('sending');
    const messageToQuote = quotedMessage; setQuotedMessage(null);
    const tempId = `temp_audio_${Date.now()}`;
    const audioMimeType = audioBlob.type;
    const tempAudioUrl = audioUrl;
    let quotedData: any = null;
    if (messageToQuote) {
      quotedData = {
        id: messageToQuote.id,
        text: messageToQuote.text || messageToQuote.mediaCaption || '',
        messageType: messageToQuote.messageType,
        mediaUrl: messageToQuote.mediaUrl || null,
        mediaMimetype: messageToQuote.mediaMimetype || null,
        senderName: messageToQuote.fromMe ? 'You' : (messageToQuote.participantName || 'Contact')
      };
    }
    const optimisticMessage: Message = { id: tempId, chatId: currentChat?.id || 0, fromMe: true, messageType: 'audioMessage', text: null, timestamp: new Date().toISOString(), mediaUrl: tempAudioUrl, mediaMimetype: audioMimeType, mediaCaption: null, status: 'SENDING', quotedMessageId: messageToQuote?.id, quotedMessageText: quotedData ? JSON.stringify(quotedData) : null, isAi: false, isAutomation: false };
    mutateMessages((currentMessages = []) => [...currentMessages, optimisticMessage], false);
    optimisticUpdateChatList('🎤 Audio');
    const timer = setTimeout(() => scrollToBottom(), 100);
    try {
      const audioBase64 = await fileToBase64(audioBlob);
      const response = await fetch('/api/messages/sendAudio', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
              recipientJid: remoteJid, 
              audioBase64, 
              audioMimeType, 
              quotedMessageData: quotedData,
              instanceId: currentChat?.instanceId 
          }), 
      });
      const sentMessageData: Message = await response.json();
      if (!response.ok && !sentMessageData.status) throw new Error((sentMessageData as any).error || 'Failed to send audio.');
      mutateMessages((currentMessages = []) => currentMessages.map(msg => msg.id === tempId ? { ...sentMessageData, timestamp: new Date(sentMessageData.timestamp).toISOString() } : msg), false);
    } catch (sendError: any) {
      mutateMessages((currentMessages = []) => currentMessages.map(msg => msg.id === tempId ? { ...msg, status: 'error' as const, errorMessage: sendError.message } : msg), false);
      toast.error(`Error sending audio: ${sendError.message}`);
    } finally { clearTimeout(timer); cancelRecording(); if (tempAudioUrl) URL.revokeObjectURL(tempAudioUrl); }
  };

  const handleSendAttachment = async (file: File) => {
    if (!remoteJid) return;
    const tempMediaUrl = URL.createObjectURL(file);
    const messageToQuote = quotedMessage; 
    setQuotedMessage(null);
    
    const tempId = `temp_media_${Date.now()}`;
    const mimeType = file.type;
    const fileName = file.name;
    const messageType = mimeType.startsWith('image/')
      ? 'imageMessage'
      : mimeType.startsWith('video/')
        ? 'videoMessage'
        : 'documentMessage';
    
    let quotedData: any = null;
    if (messageToQuote) { 
        quotedData = { 
            id: messageToQuote.id, 
            text: messageToQuote.text || messageToQuote.mediaCaption || '', 
            messageType: messageToQuote.messageType, 
            mediaUrl: messageToQuote.mediaUrl || null, 
            mediaMimetype: messageToQuote.mediaMimetype || null,
            senderName: messageToQuote.fromMe ? 'You' : (messageToQuote.participantName || 'Contact')
        }; 
    }

    const optimisticMessage: Message = {
        id: tempId, 
        chatId: currentChat?.id || 0, 
        fromMe: true, 
        messageType: messageType, 
        text: messageType === 'documentMessage' ? fileName : null, 
        timestamp: new Date().toISOString(), 
        mediaUrl: tempMediaUrl, 
        mediaMimetype: mimeType, 
        mediaCaption: null, 
        status: 'SENDING', 
        quotedMessageId: messageToQuote?.id, 
        quotedMessageText: quotedData ? JSON.stringify(quotedData) : null, 
        isAi: false, 
        isAutomation: false
    };

    mutateMessages((currentMessages = []) => [...currentMessages, optimisticMessage], false);
    optimisticUpdateChatList(messageType === 'documentMessage' ? `📄 ${fileName}` : (mimeType.startsWith('image/') ? '📷 Image' : '📹 Video'));
    const timer = setTimeout(() => scrollToBottom(), 100);

    try {
        const fileBase64 = await fileToBase64(file);
        const response = await fetch('/api/messages/sendMedia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientJid: remoteJid,
                fileBase64,
                mimeType,
                fileName,
                quotedMessageData: quotedData,
                instanceId: currentChat?.instanceId
            }),
        });
        
        const sentMessageData: Message = await response.json();
        if (!response.ok && !sentMessageData.status) throw new Error((sentMessageData as any).error || 'Failed to send media.');

        mutateMessages((currentMessages = []) => currentMessages.map(msg => msg.id === tempId ? { ...sentMessageData, timestamp: new Date(sentMessageData.timestamp).toISOString() } : msg), false);
    } catch (sendError: any) {
        mutateMessages((currentMessages = []) => currentMessages.map(msg => msg.id === tempId ? { ...msg, status: 'error' as const, errorMessage: sendError.message } : msg), false);
        toast.error(`Error sending file: ${sendError.message}`);
    } finally {
        clearTimeout(timer);
        URL.revokeObjectURL(tempMediaUrl);
    }
  };

  const handleRetryMessage = async (msg: Message) => {
    mutateMessages((currentMessages = []) => currentMessages.filter(m => m.id !== msg.id), false);
    if (msg.id.startsWith('error_')) {
      fetch(`/api/messages/${msg.id}`, { method: 'DELETE' }).catch(() => {});
    }
    if (msg.text) {
      setNewMessage(msg.text);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!remoteJid || !currentChat) return;

    mutateMessages((currentMessages = []) => currentMessages.map(msg => {
      if (msg.id !== messageId) return msg;
      const currentReactions = msg.reactions || [];
      if (emoji) {
        const filtered = currentReactions.filter(r => !r.fromMe);
        const newReaction: Reaction = { id: Date.now(), emoji, fromMe: true, remoteJid: null, participantName: null };
        return { ...msg, reactions: [...filtered, newReaction] };
      } else {
        return { ...msg, reactions: currentReactions.filter(r => !r.fromMe) };
      }
    }), false);

    try {
      await fetch('/api/messages/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          remoteJid,
          instanceId: currentChat.instanceId,
        }),
      });
    } catch (err: any) {
      mutateMessages();
      toast.error(err.message || 'Failed to send reaction');
    }
  };

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete message');
      }
      mutateMessages((currentMessages = []) => currentMessages.map(m => m.id === messageId ? { ...m, messageType: 'deleted', text: 'This message was deleted', mediaUrl: null, mediaMimetype: null, mediaCaption: null, isStarred: false } : m), false);
      if (currentChat?.id) {
        updateChatListCache(currentChat.id, {
          lastMessageText: 'This message was deleted',
        });
      }
      toast.success('Message deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Error deleting message');
    }
  }, [mutateMessages, globalMutate]);

  const handleTogglePin = useCallback((msg: Message) => {
    if (!remoteJid) return;
    setPinnedMessageIds(prev => {
      const isPinned = prev.some(item => item.id === msg.id);
      let next;
      if (isPinned) {
        next = prev.filter(item => item.id !== msg.id);
      } else {
        const newItem = {
          id: msg.id,
          text: msg.text || msg.mediaCaption || (msg.messageType === 'imageMessage' ? '📷 Image' : msg.messageType === 'videoMessage' ? '📹 Video' : 'Attachment'),
          timestamp: msg.timestamp
        };
        next = [...prev, newItem];
      }
      localStorage.setItem(`pinned_${remoteJid}`, JSON.stringify(next));
      toast.success(isPinned ? 'Message unpinned' : 'Message pinned');
      return next;
    });
  }, [remoteJid]);

  const handleToggleStar = useCallback(async (msg: Message) => {
    const newStarred = !msg.isStarred;
    try {
      const response = await fetch(`/api/messages/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: newStarred }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update star status');
      }
      mutateMessages((currentMessages = []) => currentMessages.map(m => m.id === msg.id ? { ...m, isStarred: newStarred } : m), false);
      if (currentChat?.id) {
        updateChatListCache(currentChat.id, {
          // hasStarred property removed as it doesn't exist in schema
        });
      }
      toast.success(newStarred ? 'Message starred' : 'Message unstarred');
    } catch (err: any) {
      toast.error(err.message || 'Error updating star status');
    }
  }, [mutateMessages, globalMutate]);

  const handleStartEdit = useCallback((msg: Message) => {
    setEditingMessage(msg);
  }, []);

  const handleSaveEdit = async (msgId: string, newText: string) => {
    if (!newText.trim()) return;
    try {
      const response = await fetch(`/api/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to edit message');
      }
      mutateMessages((currentMessages = []) => currentMessages.map(m => m.id === msgId ? { ...m, text: newText, isEdited: true } : m), false);
      if (currentChat?.id) {
        updateChatListCache(currentChat.id, {
          lastMessageText: newText,
        });
      }
      toast.success('Message edited successfully');
      setEditingMessage(null);
    } catch (err: any) {
      toast.error(err.message || 'Error editing message');
    }
  };

  const handleForwardTo = async (targetChat: Chat) => {
    if (!forwardingMessage) return;
    const targetJid = targetChat.remoteJid;
    const targetInstanceId = targetChat.instanceId;
    
    const toastId = toast.loading(`Forwarding message...`);
    try {
      if (forwardingMessage.mediaUrl) {
        const response = await fetch(forwardingMessage.mediaUrl);
        const blob = await response.blob();
        const fileBase64 = await fileToBase64(blob);
        
        const urlParts = forwardingMessage.mediaUrl.split('/');
        const rawFileName = urlParts[urlParts.length - 1] || 'media_file';
        const fileName = rawFileName.includes('?') ? rawFileName.split('?')[0] : rawFileName;
        
        const sendRes = await fetch('/api/messages/sendMedia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientJid: targetJid,
            fileBase64,
            mimeType: forwardingMessage.mediaMimetype || blob.type || 'application/octet-stream',
            fileName,
            instanceId: targetInstanceId
          }),
        });
        
        if (!sendRes.ok) {
          const errData = await sendRes.json();
          throw new Error(errData.error || 'Failed to forward media message');
        }
      } else {
        const text = forwardingMessage.text || forwardingMessage.mediaCaption || '';
        const sendRes = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientJid: targetJid,
            text,
            instanceId: targetInstanceId
          }),
        });
        
        if (!sendRes.ok) {
          const errData = await sendRes.json();
          throw new Error(errData.error || 'Failed to forward text message');
        }
      }
      toast.success('Message forwarded successfully', { id: toastId });
      setForwardingMessage(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to forward message', { id: toastId });
    }
  };

  const handleFileIconClick = (acceptType: string) => {
      if (fileInputRef.current) { 
          fileInputRef.current.accept = acceptType; 
          fileInputRef.current.click(); 
      } 
  };
  
  const onEmojiClick = (emojiData: EmojiClickData) => { setNewMessage(prev => prev + emojiData.emoji); };

  const handleSendTemplate = async (templateId: number, variables: Record<string, string>) => {
    if (!remoteJid || !currentChat?.instanceId) return;
    try {
      const response = await fetch('/api/messages/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientJid: remoteJid,
          templateId,
          instanceId: currentChat.instanceId,
          variables
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send template.');
      mutateMessages((currentMessages = []) => [...currentMessages, { ...data, timestamp: new Date(data.timestamp).toISOString() }], false);
      if (currentChat?.id) {
        updateChatListCache(currentChat.id, {
          lastMessageText: data.text || 'Template message',
          lastMessageFromMe: true,
        });
      }
      toast.success(t('template_sent_success_toast'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSyncMessages = async (limit: number = 50) => {
    if (!remoteJid || !currentChat?.instanceId) return;
    setIsSyncingMessages(true);
    try {
      const res = await fetch('/api/instance/sync-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: currentChat.instanceId,
          remoteJid,
          limit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(t('sync_messages.success', { count: data.imported }));
      await mutateMessages();
      setTimeout(() => scrollToBottom('auto'), 200);
    } catch (err: any) {
      toast.error(err.message || t('sync_messages.error'));
    } finally {
      setIsSyncingMessages(false);
    }
  };

  useEffect(() => {
    setSyncDismissed(false);
    setCustomerPresence(null);
    if (presenceTimeoutRef.current) clearTimeout(presenceTimeoutRef.current);
  }, [remoteJid]);

  const showSyncBanner = !syncDismissed && currentChat?.instanceId && messages && messages.length === 0 && !isLoading && !error;

  const renderReplyPreview = () => {
    if (!quotedMessage) return null;
    
    const isQuotedMe = quotedMessage.fromMe;
    const senderName = isQuotedMe ? 'You' : (quotedMessage.participantName || 'Contact');
    const previewText = quotedMessage.text || quotedMessage.mediaCaption || getQuotedTextFallback(quotedMessage.messageType || undefined);
    const hasMedia = quotedMessage.mediaUrl && quotedMessage.messageType && ['imageMessage', 'videoMessage', 'stickerMessage'].includes(quotedMessage.messageType);

    return (
      <div className="relative p-2 px-4 border-t bg-accent flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex-1 min-w-0 p-2 rounded-md bg-muted border-l-4 border-primary flex items-center justify-between gap-2 text-xs select-none">
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-primary">{senderName}</p>
            <div className="flex items-center gap-1 text-muted-foreground mt-0.5 truncate">
              {quotedMessage.messageType === 'documentMessage' && (
                <FileIcon className="h-3.5 w-3.5 shrink-0" />
              )}
              {quotedMessage.messageType === 'audioMessage' && (
                <Mic className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{previewText}</span>
            </div>
          </div>
          {hasMedia && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted border">
              {quotedMessage.messageType === 'videoMessage' ? (
                <video src={quotedMessage.mediaUrl || undefined} className="h-full w-full object-cover" />
              ) : (
                <img src={quotedMessage.mediaUrl || undefined} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0" onClick={() => setQuotedMessage(null)}>
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    );
  };

  const renderMessages = () => {
    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    if (error) return <div className="p-4 text-center text-destructive">Error loading messages.</div>;
    if (!filteredMessages || filteredMessages.length === 0) {
      if (deferredSearchQuery) return <div className="p-4 text-center text-muted-foreground">No message found for "{deferredSearchQuery}".</div>;
      return <div className="p-4 text-center text-muted-foreground">No messages in this chat yet.</div>;
    }

    return filteredMessages.map((msg, index) => {
        const currentDate = parseDateSafe(msg.timestamp);
        let showSeparator = false;
        let dateLabel = '';

        if (index === 0) {
            showSeparator = true;
            dateLabel = formatDateSeparator(currentDate);
        } else {
            const prevMsg = filteredMessages[index - 1];
            const prevDate = parseDateSafe(prevMsg.timestamp);
            if (!isSameDay(currentDate, prevDate)) {
                showSeparator = true;
                dateLabel = formatDateSeparator(currentDate);
            }
        }

        return (
            <React.Fragment key={msg.id}>
                {showSeparator && <DateSeparator date={currentDate} label={dateLabel} />}
                <MessageBubble
                    msg={msg}
                    onMediaClick={handleMediaClick}
                    onReply={setQuotedMessage}
                    onRetry={handleRetryMessage}
                    onReact={handleReact}
                    onDelete={handleDeleteMessage}
                    onForward={setForwardingMessage}
                    onTogglePin={handleTogglePin}
                    onToggleStar={handleToggleStar}
                    onShowInfo={setInfoMessage}
                    onStartEdit={handleStartEdit}
                    isEditing={editingMessage?.id === msg.id}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={() => setEditingMessage(null)}
                    isPinned={pinnedMessageIds.some(item => item.id === msg.id)}
                    isStarred={starredMessageIds.includes(msg.id)}
                    searchQuery={deferredSearchQuery}
                    userBubbleColor={activeUserBubble}
                    contactBubbleColor={activeContactBubble}
                    isGroup={isGroup}
                />
            </React.Fragment>
        );
    });
  };

  return (
    <div className="flex h-full min-h-0 bg-background">
      <div className="flex flex-col flex-1 min-h-0 min-w-0">

        <ChatHeader
          chatId={currentChat?.id}
          isPinned={currentChat?.isPinned}
          isArchived={currentChat?.isArchived}
          chatDetails={chatDetails}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSidebarCollapsed={chatSidebarCollapsed}
          onToggleSidebar={toggleChatSidebar}
          isGroup={isGroup}
          peerTyping={peerTyping}
          phone={chatDetails.phone}
          customerPresence={customerPresence}
        />

        {showSyncBanner && (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 text-sm shrink-0">
            <Download className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-blue-700 dark:text-blue-300">{t('sync_messages.banner')}</span>
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 ml-auto" onClick={() => handleSyncMessages(100)} disabled={isSyncingMessages}>
              {isSyncingMessages ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
              {t('sync_messages.import_btn')}
            </Button>
            <button className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 shrink-0" onClick={() => setSyncDismissed(true)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {pinnedMessageIds.length > 0 && (
          <div className="bg-background/80 backdrop-blur-md border-b px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0 z-10 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer" onClick={() => {
              const latestPin = pinnedMessageIds[pinnedMessageIds.length - 1];
              const el = document.getElementById(`msg-${latestPin.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('animate-highlight-flash');
                setTimeout(() => el.classList.remove('animate-highlight-flash'), 2000);
              } else {
                toast.info('Message is older. Scroll up to find it.');
              }
            }}>
              <Pin className="h-3.5 w-3.5 text-primary shrink-0 rotate-45" />
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-primary/80">Pinned Message</span>
                <span className="text-muted-foreground truncate">{pinnedMessageIds[pinnedMessageIds.length - 1].text}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pinnedMessageIds.length > 1 && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                  +{pinnedMessageIds.length - 1} more
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => {
                const latestPin = pinnedMessageIds[pinnedMessageIds.length - 1];
                setPinnedMessageIds(prev => {
                  const next = prev.filter(item => item.id !== latestPin.id);
                  localStorage.setItem(`pinned_${remoteJid}`, JSON.stringify(next));
                  return next;
                });
                toast.success('Message unpinned');
              }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <main
          ref={messagesMainRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto p-4 space-y-1"
          style={{
            backgroundColor: activeThemeBg || undefined,
            ...(chatTheme?.backgroundType === 'image' && chatTheme?.backgroundImageUrl
              ? {
                  backgroundImage: `url(${chatTheme.backgroundImageUrl})`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '200px',
                }
              : {}),
          }}
        >
          {loadingOlder && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {renderMessages()}
          <div ref={messagesEndRef} />
        </main>

        {renderReplyPreview()}

        <footer className="flex flex-col border-t bg-background shrink-0">
          {peerTyping && (
            <p className="px-4 py-1.5 text-xs text-primary/80 animate-pulse">
              {peerTyping} is typing…
            </p>
          )}
          <ChatInput
            isInternalNote={isInternalNote}
            setIsInternalNote={setIsInternalNote}
            newMessage={newMessage}
            setNewMessage={(v) => {
              setNewMessage(v);
              if (remoteJid && v.trim()) notifyTyping(remoteJid);
            }}
            recordingStatus={recordingStatus}
            recordingTime={recordingTime}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onCancelRecording={cancelRecording}
            onSendText={handleSendText}
            onSendAudio={handleSendAudio}
            onSendAttachment={handleSendAttachment}
            onSendLocation={handleSendLocation}
            onShareContact={handleShareContact}
            audioUrl={audioUrl}
            isAudioPlaying={isAudioPlaying}
            toggleAudioPlayback={toggleAudioPlayback}
            audioPlayerRef={audioPlayerRef as React.RefObject<HTMLAudioElement>}
            fileInputRef={fileInputRef as unknown as React.RefObject<HTMLInputElement>}
            handleFileIconClick={handleFileIconClick}
            onEmojiClick={onEmojiClick}
            quickRepliesOpen={quickRepliesOpen}
            setQuickRepliesOpen={setQuickRepliesOpen}
            showQuickReplySuggestions={showQuickReplySuggestions}
            setShowQuickReplySuggestions={setShowQuickReplySuggestions}
            filteredQuickReplies={filteredQuickReplies}
            isWindowExpired={isWindowExpired}
            onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
            isGroup={isGroup}
          />
        </footer>
      </div>

      {isMounted && chatSidebarCollapsed ? (
        <div className="hidden lg:flex w-12 shrink-0 flex-col items-center border-l bg-card py-3">
          <Button variant="ghost" size="icon" onClick={toggleChatSidebar} aria-label="Expand CRM">
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        </div>
      ) : (isMounted ? (
        <CrmPanel
          chatDetails={chatDetails}
          chatId={currentChat?.id}
          collapsed={false}
          onToggleCollapse={toggleChatSidebar}
        />
      ) : (
        <div className="hidden lg:block w-[320px] shrink-0 border-l bg-card" />
      ))}

      <QuickRepliesModal open={quickRepliesOpen} onOpenChange={setQuickRepliesOpen} replies={quickReplies} />
      <TemplateDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} onSendTemplate={handleSendTemplate} />

      {/* Forwarding Dialog */}
      <Dialog open={!!forwardingMessage} onOpenChange={(open) => { if (!open) setForwardingMessage(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
            <DialogDescription>Select a contact or group to forward this message to.</DialogDescription>
          </DialogHeader>
          <div className="py-2 flex flex-col min-h-0">
            <input
              type="text"
              placeholder="Search chats..."
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary bg-background shrink-0"
            />
            {filteredForwardChats.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground shrink-0">
                No chats found.
              </div>
            ) : (
              <div ref={parentRef} className="h-80 overflow-y-auto pr-1 select-none">
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const chat = filteredForwardChats[virtualRow.index];
                    if (!chat) return null;

                    const displayName = getChatDisplayName(chat);
                    const phone = chat.remoteJid.split('@')[0];
                    const formattedPhone = formatPhoneNumber(chat.remoteJid);
                    const hasName = displayName && displayName !== phone && displayName !== `+${phone}`;
                    const isOnline = isContactOnline(chat.lastCustomerInteraction);

                    return (
                      <div
                        key={chat.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className="relative shrink-0">
                            {chat.profilePicUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={chat.profilePicUrl}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                                {displayName[0]?.toUpperCase() || 'C'}
                              </div>
                            )}
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden text-sm text-left">
                            {hasName ? (
                              <>
                                <span className="font-medium truncate">{displayName}</span>
                                <span className="text-xs text-muted-foreground truncate">{formattedPhone}</span>
                              </>
                            ) : (
                              <span className="font-medium truncate">{formattedPhone}</span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleForwardTo(chat)}>
                          Forward
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Info Dialog */}
      <Dialog open={!!infoMessage} onOpenChange={(open) => { if (!open) setInfoMessage(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Message Info</DialogTitle>
            <DialogDescription>Technical details and transmission history.</DialogDescription>
          </DialogHeader>
          {infoMessage && (
            <div className="py-2 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Message ID</span>
                <span className="font-mono text-xs select-all">{infoMessage.id}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize font-semibold">{infoMessage.status || 'Sent'}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Type</span>
                <span className="font-mono text-xs">{infoMessage.messageType || 'Text'}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Sent At</span>
                <span>{new Date(infoMessage.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Direction</span>
                <span>{infoMessage.fromMe ? 'Outgoing' : 'Incoming'}</span>
              </div>
              {infoMessage.isAi && (
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Generated by AI</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">Yes</span>
                </div>
              )}
              {infoMessage.isInternal && (
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Internal Note</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Yes</span>
                </div>
              )}
              {infoMessage.text && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Text Content</span>
                  <div className="p-2 rounded bg-muted/50 font-mono text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {infoMessage.text}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} plugins={[Zoom, Video]} zoom={{ maxZoomPixelRatio: 3, doubleTapDelay: 300 }} />
    </div>
  );
}
