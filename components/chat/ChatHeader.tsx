'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PanelRight, Search, X } from 'lucide-react';
import type { ChatDetails } from './types';

type Props = {
  chatDetails: ChatDetails;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isGroup?: boolean;
};

export function ChatHeader({
  chatDetails,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  onToggleSidebar,
}: Props) {
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b bg-background px-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={chatDetails.profilePicUrl ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {chatDetails.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold text-foreground">{chatDetails.name}</h2>
        <p className="truncate text-xs text-muted-foreground">{chatDetails.integration}</p>
      </div>
      {showSearch ? (
        <div className="flex flex-1 items-center gap-2 max-w-xs">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat…"
            className="h-9"
            autoFocus
          />
          <Button variant="ghost" size="icon" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
          <Search className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
        <PanelRight className="h-4 w-4" />
      </Button>
    </header>
  );
}
