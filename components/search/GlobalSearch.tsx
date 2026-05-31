'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Command } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

interface SearchResult {
  chats: any[];
  messages: any[];
  contacts: any[];
  users: any[];
  instances: any[];
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useSWR<SearchResult>(
    debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    (url: string) => fetch(url).then(r => r.json())
  );

  const handleSelect = useCallback((type: string, id: string | number, jid?: string) => {
    onOpenChange(false);
    setQuery('');
    
    if (type === 'chat' && jid) {
      router.push(`/dashboard/chat/${encodeURIComponent(jid)}`);
    } else if (type === 'contact') {
      router.push(`/contacts`);
    } else if (type === 'instance') {
      router.push(`/settings/connect`);
    }
  }, [router, onOpenChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  const totalResults = results ? 
    results.chats.length + results.messages.length + results.contacts.length + 
    results.users.length + results.instances.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search across chats, messages, contacts, users, and instances.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center px-4 py-3 border-b">
          <Search className="w-5 h-5 mr-3 text-muted-foreground" />
          <Input
            placeholder="Search chats, messages, contacts, users, instances..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-base border-0 focus-visible:ring-0"
            autoFocus
          />
          <Badge variant="outline" className="ml-3 text-xs">
            <Command className="w-3 h-3 mr-1" /> K
          </Badge>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading && query.length >= 2 && (
            <div className="py-8 text-center text-muted-foreground">Searching...</div>
          )}

          {!isLoading && query.length >= 2 && results && totalResults === 0 && (
            <div className="py-8 text-center text-muted-foreground">No results found</div>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-8 text-sm text-center text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {results && totalResults > 0 && (
            <div className="space-y-6">
              {results.chats.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Chats</h3>
                  <div className="space-y-1">
                    {results.chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleSelect('chat', chat.id, chat.remoteJid)}
                        className="w-full px-3 py-2 text-left transition-colors rounded-md hover:bg-accent"
                      >
                        <div className="font-medium">{chat.name || chat.remoteJid}</div>
                        {chat.lastMessageText && (
                          <div className="text-sm truncate text-muted-foreground">
                            {chat.lastMessageText}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.messages.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Messages</h3>
                  <div className="space-y-1">
                    {results.messages.slice(0, 10).map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => handleSelect('chat', msg.chatId, msg.chat?.remoteJid)}
                        className="w-full px-3 py-2 text-left transition-colors rounded-md hover:bg-accent"
                      >
                        <div className="text-sm truncate">{msg.text}</div>
                        <div className="text-xs text-muted-foreground">
                          {msg.chat?.name || msg.chat?.remoteJid}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.contacts.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Contacts</h3>
                  <div className="space-y-1">
                    {results.contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleSelect('contact', contact.id)}
                        className="w-full px-3 py-2 text-left transition-colors rounded-md hover:bg-accent"
                      >
                        <div className="font-medium">{contact.name}</div>
                        {contact.assignedUser && (
                          <div className="text-xs text-muted-foreground">
                            Assigned: {contact.assignedUser.name}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.users.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Team Members</h3>
                  <div className="space-y-1">
                    {results.users.map((user) => (
                      <div key={user.id} className="px-3 py-2">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.instances.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Instances</h3>
                  <div className="space-y-1">
                    {results.instances.map((instance) => (
                      <button
                        key={instance.id}
                        onClick={() => handleSelect('instance', instance.id)}
                        className="w-full px-3 py-2 text-left transition-colors rounded-md hover:bg-accent"
                      >
                        <div className="font-medium">{instance.displayName || instance.instanceName}</div>
                        <div className="text-xs text-muted-foreground">{instance.integration}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
