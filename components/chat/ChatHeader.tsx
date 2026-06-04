'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PanelRight, Search, X, Phone, MoreVertical, Pin, Archive, Trash2 } from 'lucide-react';
import type { ChatDetails } from './types';
import { getChatInitials, isContactOnline } from '@/lib/inbox/utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { useSWRConfig } from 'swr';

type Props = {
  chatId?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  chatDetails: ChatDetails;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isGroup?: boolean;
  peerTyping?: string | null;
  phone?: string | null;
  customerPresence?: 'composing' | 'recording' | 'available' | 'unavailable' | null;
};

export function ChatHeader({
  chatId,
  isPinned,
  isArchived,
  chatDetails,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  onToggleSidebar,
  peerTyping,
  phone,
  customerPresence,
}: Props) {
  const online = isContactOnline(chatDetails.lastCustomerInteraction);
  const initials = getChatInitials(chatDetails.name);
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const handleTogglePin = async () => {
    if (!chatId) return;
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      });
      if (!response.ok) throw new Error('Failed to update pinned status');
      toast.success(isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      mutate('/api/chats');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleArchive = async () => {
    if (!chatId) return;
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !isArchived }),
      });
      if (!response.ok) throw new Error('Failed to update archive status');
      toast.success(isArchived ? 'Conversation unarchived' : 'Conversation archived');
      mutate('/api/chats');
      if (!isArchived) {
        router.push('/inbox');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false);
    if (!chatId) return;
    try {
      const response = await fetch('/api/chats/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatIds: [chatId] }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete conversation');
      }
      toast.success('Conversation deleted successfully');
      
      // Mutate all SWR keys starting with /api/chats to update the UI immediately
      mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/chats'),
        undefined,
        { revalidate: true }
      );

      router.push('/inbox');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={chatDetails.profilePicUrl ?? undefined} alt={chatDetails.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-foreground">{chatDetails.name}</h2>
        <div className="flex items-center gap-1.5">
          {peerTyping ? (
            <span className="text-xs text-primary animate-pulse">{peerTyping} is typing…</span>
          ) : customerPresence === 'composing' ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">typing...</span>
          ) : customerPresence === 'recording' ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">recording audio...</span>
          ) : (customerPresence === 'available' || online) ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </>
          ) : (
            <span className="truncate text-xs text-muted-foreground">
              {phone || chatDetails.integration}
            </span>
          )}
        </div>
      </div>

      {showSearch ? (
        <div className="flex flex-1 max-w-xs items-center gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat…"
            className="h-9"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-9 w-9" aria-label="Call">
            <Phone className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(true)}>
            <Search className="h-4 w-4" />
          </Button>
          
          {chatId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="More options">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleTogglePin} className="gap-2 cursor-pointer">
                  <Pin className="h-4 w-4" />
                  <span>{isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleArchive} className="gap-2 cursor-pointer">
                  <Archive className="h-4 w-4" />
                  <span>{isArchived ? 'Unarchive chat' : 'Archive chat'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeleteClick} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span>Delete chat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9 hidden xl:inline-flex')}
        onClick={onToggleSidebar}
        aria-label="Toggle CRM panel"
      >
        <PanelRight className="h-4 w-4" />
      </Button>

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
    </header>
  );
}
