'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PanelRight, Search, X, Phone, MoreVertical } from 'lucide-react';
import type { ChatDetails } from './types';
import { getChatInitials, isContactOnline } from '@/lib/inbox/utils';
import { cn } from '@/lib/utils';

type Props = {
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
};

export function ChatHeader({
  chatDetails,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  onToggleSidebar,
  peerTyping,
  phone,
}: Props) {
  const online = isContactOnline(chatDetails.lastCustomerInteraction);
  const initials = getChatInitials(chatDetails.name);

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
          ) : online ? (
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
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-9 w-9" aria-label="More">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
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
    </header>
  );
}
