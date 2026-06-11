'use client';

import { useRef, memo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Link, useRouter } from '@/i18n/routing';
import { ChatListItem, type Chat } from '@/components/dashboard/ChatListItem';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Pin, Archive, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

const ROW_HEIGHT = 76;

type InstanceRow = { dbId: number; instanceName: string };

type VirtualizedChatListProps = {
  chats: Chat[];
  activeChatNumber: string | null;
  activeInstanceId: string | null;
  instances: InstanceRow[];
};

const VirtualizedChatItem = memo(function VirtualizedChatItem({
  chat,
  isActive,
  href,
  itemHeight,
  itemTop,
}: {
  chat: Chat;
  isActive: boolean;
  href: string;
  itemHeight: number;
  itemTop: number;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newPinned = !chat.isPinned;
    const now = new Date().toISOString();
    try {
      // Optimistic local update — no full reload, no flicker
      await mutate(
        (key: any) => typeof key === 'string' && key.startsWith('/api/chats'),
        (current: any) => {
          if (!Array.isArray(current)) return current;
          return current.map((c: any) =>
            c.id === chat.id
              ? { ...c, isPinned: newPinned, pinnedAt: newPinned ? now : null }
              : c
          );
        },
        { revalidate: false }
      );

      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newPinned }),
      });
      if (!response.ok) throw new Error('Failed to update pin status');
      toast.success(newPinned ? 'Conversation pinned' : 'Conversation unpinned');
      // Revalidate to sync with server
      await mutate('/api/chats');
    } catch (err: any) {
      // Rollback optimistic update on failure
      await mutate('/api/chats');
      toast.error(err.message);
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newArchived = !chat.isArchived;
    try {
      // Optimistic local update: move between active/archived lists without reload
      await mutate(
        (key: any) => typeof key === 'string' && key.startsWith('/api/chats'),
        (current: any) => {
          if (!Array.isArray(current)) return current;
          if (newArchived) {
            // Remove from active list
            if (!current.some((c: any) => c.isArchived === true || c.isArchived === false)) return current;
            return current.filter((c: any) => c.id !== chat.id);
          } else {
            // Remove from archived list
            return current.filter((c: any) => c.id !== chat.id);
          }
        },
        { revalidate: false }
      );

      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: newArchived }),
      });
      if (!response.ok) throw new Error('Failed to update archive status');
      toast.success(newArchived ? 'Conversation archived' : 'Conversation unarchived');
      // Revalidate both caches
      await mutate('/api/chats');
      await mutate('/api/chats/archive');
      if (isActive) {
        router.push('/inbox');
      }
    } catch (err: any) {
      await mutate('/api/chats');
      await mutate('/api/chats/archive');
      toast.error(err.message);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false);

    // 1. Optimistic update: instantly remove from SWR lists
    console.log("[CHAT DELETE CACHE UPDATE]", { chatId: chat.id });
    const mutateKeysFilter = (key: any) => typeof key === 'string' && key.startsWith('/api/chats');

    await mutate(
      mutateKeysFilter,
      (currentData: any) => {
        if (!Array.isArray(currentData)) return currentData;
        return currentData.filter((c: any) => {
          if (c.id === chat.id) return false;
          if (c.chat && c.chat.id === chat.id) return false;
          return true;
        });
      },
      { revalidate: false }
    );

    try {
      console.log("[CHAT DELETE REQUEST]", { chatIds: [chat.id] });
      const response = await fetch('/api/chats/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatIds: [chat.id] }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete conversation');
      }

      const result = await response.json();
      console.log("[CHAT DELETE SUCCESS]", result);
      toast.success('Conversation deleted successfully');
      
      // 2. Final revalidation to sync with the server
      await mutate(mutateKeysFilter, undefined, { revalidate: true });

      if (isActive) {
        router.push('/inbox');
      }
    } catch (err: any) {
      toast.error(err.message);
      // Restore on failure by triggering a revalidation
      await mutate(mutateKeysFilter, undefined, { revalidate: true });
    }
  };

  return (
    <div className="absolute left-0 top-0 w-full" style={{ height: itemHeight, transform: `translateY(${itemTop}px)` }}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Link href={href} className="block h-full">
            <ChatListItem chat={chat} isActive={isActive} />
          </Link>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleTogglePin} className="gap-2 cursor-pointer">
            <Pin className="h-4 w-4" />
            <span>{chat.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleToggleArchive} className="gap-2 cursor-pointer">
            <Archive className="h-4 w-4" />
            <span>{chat.isArchived ? 'Unarchive chat' : 'Archive chat'}</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleDeleteClick} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span>Delete chat</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this conversation and all of its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

export const VirtualizedChatList = memo(function VirtualizedChatList({
  chats,
  activeChatNumber,
  activeInstanceId,
}: VirtualizedChatListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: chats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5, // reduced from 10 — fewer off-screen items re-rendering
  });

  const decodedActive = activeChatNumber ? decodeURIComponent(activeChatNumber) : null;

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const chat = chats[virtualRow.index];
          const isGroup = chat.remoteJid?.endsWith('@g.us') ?? false;
          const chatIdentifier = isGroup
            ? chat.remoteJid
            : (chat.remoteJid?.split('@')[0] ?? String(chat.id));
          const isActive =
            chatIdentifier === decodedActive &&
            (!activeInstanceId || chat.instanceId === parseInt(activeInstanceId, 10));
          const href = `/inbox/chat/${encodeURIComponent(chatIdentifier)}${
            chat.instanceId ? `?instanceId=${chat.instanceId}` : ''
          }`;

          return (
            <VirtualizedChatItem
              key={chat.id}
              chat={chat}
              isActive={isActive}
              href={href}
              // Pass primitives so memo comparison works correctly.
              // A style object literal {} is always a new reference → bypasses memo.
              itemHeight={virtualRow.size}
              itemTop={virtualRow.start}
            />
          );
        })}
      </div>
    </div>
  );
});

