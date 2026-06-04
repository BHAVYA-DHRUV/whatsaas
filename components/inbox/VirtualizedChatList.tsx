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
  style,
}: {
  chat: Chat;
  isActive: boolean;
  href: string;
  style: React.CSSProperties;
}) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !chat.isPinned }),
      });
      if (!response.ok) throw new Error('Failed to update pin status');
      toast.success(chat.isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      mutate('/api/chats');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !chat.isArchived }),
      });
      if (!response.ok) throw new Error('Failed to update archive status');
      toast.success(chat.isArchived ? 'Conversation unarchived' : 'Conversation archived');
      mutate('/api/chats');
      if (isActive) {
        router.push('/inbox');
      }
    } catch (err: any) {
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
    try {
      const response = await fetch('/api/chats/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatIds: [chat.id] }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete conversation');
      }
      toast.success('Conversation deleted successfully');
      
      // Mutate all SWR keys starting with /api/chats to update the UI across components
      mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/chats'),
        undefined,
        { revalidate: true }
      );

      if (isActive) {
        router.push('/inbox');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="absolute left-0 top-0 w-full" style={style}>
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
            <span>{chat.isArchived ? 'Archive chat' : 'Unarchive chat'}</span>
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
  instances,
}: VirtualizedChatListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: chats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
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
          const isGroup = chat.remoteJid.endsWith('@g.us');
          const chatIdentifier = isGroup ? chat.remoteJid : chat.remoteJid.split('@')[0];
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
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
});
