'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Command, MessageSquare, Users, Smartphone, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { isDigitOnlyQuery } from '@/lib/search/normalize';
import { HighlightMatch } from '@/components/inbox/HighlightMatch';

interface SearchResult {
  chats: any[];
  messages: any[];
  contacts: any[];
  users: any[];
  instances: any[];
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 200ms debounce — matches WhatsApp Web response feel
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Allow 1-char search for digit-only (phone) queries
  const isPhone = isDigitOnlyQuery(debouncedQuery);
  const shouldSearch =
    debouncedQuery.length >= 2 || (debouncedQuery.length === 1 && isPhone);

  const { data: results, isLoading } = useSWR<SearchResult>(
    shouldSearch ? `/api/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3000 }
  );

  const handleSelect = useCallback(
    (type: string, _id: string | number, jid?: string, instanceId?: number) => {
      onOpenChange(false);
      setQuery('');

      if (type === 'chat' && jid) {
        const isGroup = jid.endsWith('@g.us');
        const identifier = isGroup ? jid : jid.split('@')[0];
        const url = `/inbox/chat/${encodeURIComponent(identifier)}${instanceId ? `?instanceId=${instanceId}` : ''}`;
        router.push(url);
      } else if (type === 'message' && jid) {
        const isGroup = jid.endsWith('@g.us');
        const identifier = isGroup ? jid : jid.split('@')[0];
        const url = `/inbox/chat/${encodeURIComponent(identifier)}${instanceId ? `?instanceId=${instanceId}` : ''}`;
        router.push(url);
      } else if (type === 'contact') {
        router.push(`/contacts`);
      } else if (type === 'instance') {
        router.push(`/settings/connect`);
      }
    },
    [router, onOpenChange]
  );

  // Keyboard shortcut: Ctrl+K / Cmd+K
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

  const totalResults = results
    ? results.chats.length + results.messages.length + results.contacts.length +
      results.users.length + results.instances.length
    : 0;

  const showMinLength = !shouldSearch && query.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search across chats, messages, contacts, users, and instances.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Search chats, messages, contacts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent"
            autoFocus
          />
          <Badge variant="outline" className="shrink-0 text-xs gap-1">
            <Command className="w-3 h-3" /> K
          </Badge>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {isLoading && shouldSearch && (
            <div className="py-10 text-center text-sm text-muted-foreground">Searching…</div>
          )}

          {/* Minimum length hint */}
          {showMinLength && (
            <div className="py-10 text-sm text-center text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {/* No results */}
          {!isLoading && shouldSearch && results && totalResults === 0 && (
            <div className="py-10 text-sm text-center text-muted-foreground flex flex-col items-center gap-2">
              <Search className="w-7 h-7 text-muted-foreground/30" />
              <span>No results for "{query}"</span>
            </div>
          )}

          {/* Idle state */}
          {!query && (
            <div className="py-10 text-sm text-center text-muted-foreground">
              Start typing to search…
            </div>
          )}

          {/* Results list */}
          {results && totalResults > 0 && (
            <div className="pb-4">
              {/* Chats */}
              {results.chats.length > 0 && (
                <section>
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b">
                    Chats
                  </div>
                  {results.chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelect('chat', chat.id, chat.remoteJid, chat.instanceId)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 border-b last:border-0"
                    >
                      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          <HighlightMatch text={chat.name || chat.remoteJid} query={query} />
                        </div>
                        {chat.lastMessageText && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            <HighlightMatch text={chat.lastMessageText} query={query} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Messages */}
              {results.messages.length > 0 && (
                <section>
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-t">
                    Messages
                  </div>
                  {results.messages.slice(0, 10).map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => handleSelect('message', msg.id, msg.chat?.remoteJid, msg.chat?.instanceId)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        <HighlightMatch text={msg.chat?.name || msg.chat?.remoteJid} query={query} />
                      </div>
                      <div className="text-sm truncate">
                        <HighlightMatch text={msg.text} query={query} />
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Contacts */}
              {results.contacts.length > 0 && (
                <section>
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-t">
                    Contacts
                  </div>
                  {results.contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelect('contact', contact.id)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 border-b last:border-0"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          <HighlightMatch text={contact.name} query={query} />
                        </div>
                        {contact.phone && (
                          <div className="text-xs text-muted-foreground">
                            <HighlightMatch text={contact.phone} query={query} />
                          </div>
                        )}
                        {contact.assignedUser && (
                          <div className="text-xs text-muted-foreground">
                            Assigned: {contact.assignedUser.name}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Team members */}
              {results.users.length > 0 && (
                <section>
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-t">
                    Team Members
                  </div>
                  {results.users.map((user: any) => (
                    <div
                      key={user.id}
                      className="px-4 py-3 flex items-center gap-3 border-b last:border-0"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          <HighlightMatch text={user.name} query={query} />
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Instances */}
              {results.instances.length > 0 && (
                <section>
                  <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-t">
                    Instances
                  </div>
                  {results.instances.map((instance: any) => (
                    <button
                      key={instance.id}
                      onClick={() => handleSelect('instance', instance.id)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3 border-b last:border-0"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          <HighlightMatch text={instance.displayName || instance.instanceName} query={query} />
                        </div>
                        <div className="text-xs text-muted-foreground">{instance.integration}</div>
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
