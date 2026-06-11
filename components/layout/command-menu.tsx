'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Inbox,
  Kanban,
  Users,
  Megaphone,
  Workflow,
  BarChart3,
  Phone,
  FileText,
  Settings,
  QrCode,
  Bot,
  Terminal,
  Activity,
  Shield,
  MessageSquare,
  User2,
  Loader2,
  User,
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SearchResults {
  chats?: Array<{
    id: string;
    remoteJid: string;
    name: string;
    pushName?: string;
    lastMessageText?: string;
  }>;
  messages?: Array<{
    id: string;
    text: string;
    timestamp: string;
    chat?: {
      id: string;
      remoteJid: string;
      name: string;
    };
  }>;
  contacts?: Array<{
    id: number;
    name: string;
    phone: string;
    chat?: {
      id: string;
      remoteJid: string;
    };
  }>;
  users?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  instances?: Array<{
    id: string;
    displayName: string;
    instanceName: string;
    profileName?: string;
  }>;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const NAV_ITEMS = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
  { title: 'Inbox', href: '/inbox', icon: Inbox, category: 'Navigation' },
  { title: 'Pipeline', href: '/pipeline', icon: Kanban, category: 'Navigation' },
  { title: 'Contacts', href: '/contacts', icon: Users, category: 'Navigation' },
  { title: 'Campaigns', href: '/campaigns', icon: Megaphone, category: 'Navigation' },
  { title: 'Automation', href: '/automation', icon: Workflow, category: 'Navigation' },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, category: 'Navigation' },
  { title: 'Calls', href: '/calls', icon: Phone, category: 'Navigation' },
  { title: 'Templates', href: '/templates', icon: FileText, category: 'Navigation' },
];

const SETTINGS_ITEMS = [
  { title: 'Settings - Team Members', href: '/settings', icon: Users, category: 'Settings' },
  { title: 'Settings - General Profile', href: '/settings/general', icon: Settings, category: 'Settings' },
  { title: 'Settings - Connect WhatsApp (Instances)', href: '/settings/connect', icon: QrCode, category: 'Settings' },
  { title: 'Settings - AI Agent', href: '/settings/ai', icon: Bot, category: 'Settings' },
  { title: 'Settings - Voice Call', href: '/settings/voice', icon: Phone, category: 'Settings' },
  { title: 'Settings - Developers (API)', href: '/settings/developers', icon: Terminal, category: 'Settings' },
  { title: 'Settings - Activity Logs', href: '/settings/activity', icon: Activity, category: 'Settings' },
  { title: 'Settings - Security Settings', href: '/settings/security', icon: Shield, category: 'Settings' },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const [, startTransition] = useTransition();

  const debouncedQuery = useDebounce(query, 300);
  const trimmed = debouncedQuery.trim();
  const isDigitOnly = /^\d+$/.test(trimmed);
  const shouldFetch = trimmed.length >= 2 || (trimmed.length >= 1 && isDigitOnly);

  const { data, isLoading } = useSWR<SearchResults>(
    shouldFetch ? `/api/search?q=${encodeURIComponent(trimmed)}` : null,
    fetcher
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    const handleOpenSearch = () => setOpen(true);

    document.addEventListener('keydown', down);
    window.addEventListener('open-global-search', handleOpenSearch);

    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-global-search', handleOpenSearch);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    startTransition(() => {
      command();
    });
  };

  // Filter static routes
  const filteredNav = NAV_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
  const filteredSettings = SETTINGS_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const cleanJid = (jid: string) => {
    if (jid.endsWith('@g.us')) {
      return encodeURIComponent(jid);
    }
    return jid.split('@')[0];
  };

  const getChatDisplayName = (chat: {
    name?: string | null;
    pushName?: string | null;
    remoteJid: string;
  }) => {
    const phone = chat.remoteJid.split('@')[0];
    if (chat.pushName && chat.pushName.trim() !== '' && chat.pushName !== phone && chat.pushName !== `+${phone}`) {
      return chat.pushName;
    }
    if (chat.name && chat.name.trim() !== '' && chat.name !== phone && chat.name !== `+${phone}`) {
      return chat.name;
    }
    return phone;
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type to search pages, chats, settings, contacts..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[450px]">
        {isLoading && (
          <div className="flex items-center justify-center p-4 py-8 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Searching...</span>
          </div>
        )}

        {!isLoading &&
          query.trim() !== '' &&
          filteredNav.length === 0 &&
          filteredSettings.length === 0 &&
          (!data?.chats || data.chats.length === 0) &&
          (!data?.contacts || data.contacts.length === 0) &&
          (!data?.instances || data.instances.length === 0) &&
          (!data?.users || data.users.length === 0) &&
          (!data?.messages || data.messages.length === 0) && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

        {/* Dynamic Chats */}
        {data?.chats && data.chats.length > 0 && (
          <CommandGroup heading="Chats">
            {data.chats.map((chat) => (
              <CommandItem
                key={chat.id}
                onSelect={() =>
                  runCommand(() => router.push(`/inbox/chat/${cleanJid(chat.remoteJid)}`))
                }
                className="gap-3 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate text-foreground">{getChatDisplayName(chat)}</span>
                  {chat.lastMessageText && (
                    <span className="text-xs text-muted-foreground truncate max-w-md">
                      {chat.lastMessageText}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Dynamic Contacts */}
        {data?.contacts && data.contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {data.contacts.map((contact) => (
              <CommandItem
                key={contact.id}
                onSelect={() => {
                  const targetJid = contact.chat?.remoteJid || contact.phone;
                  runCommand(() => router.push(`/inbox/chat/${cleanJid(targetJid)}`));
                }}
                className="gap-3 cursor-pointer"
              >
                <User2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-foreground">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">{contact.phone}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Dynamic Messages */}
        {data?.messages && data.messages.length > 0 && (
          <CommandGroup heading="Messages">
            {data.messages.map((msg) => (
              <CommandItem
                key={msg.id}
                onSelect={() => {
                  if (msg.chat?.remoteJid) {
                    runCommand(() =>
                      router.push(
                        `/inbox/chat/${cleanJid(msg.chat!.remoteJid)}?messageId=${msg.id}`
                      )
                    );
                  }
                }}
                className="gap-3 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    In {msg.chat ? getChatDisplayName(msg.chat) : 'Chat'}
                  </span>
                  <span className="text-sm text-foreground truncate max-w-md">{msg.text}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Dynamic Instances */}
        {data?.instances && data.instances.length > 0 && (
          <CommandGroup heading="WhatsApp Instances">
            {data.instances.map((instance) => (
              <CommandItem
                key={instance.id}
                onSelect={() =>
                  runCommand(() =>
                    router.push(`/settings/connect?instanceId=${instance.id}`)
                  )
                }
                className="gap-3 cursor-pointer"
              >
                <QrCode className="h-4 w-4 text-indigo-500 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-foreground">{instance.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {instance.instanceName} {instance.profileName ? `(${instance.profileName})` : ''}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Dynamic Team Members */}
        {data?.users && data.users.length > 0 && (
          <CommandGroup heading="Team Members">
            {data.users.map((teamMember) => (
              <CommandItem
                key={teamMember.id}
                onSelect={() => runCommand(() => router.push('/settings'))}
                className="gap-3 cursor-pointer"
              >
                <User className="h-4 w-4 text-violet-500 shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-foreground">{teamMember.name}</span>
                  <span className="text-xs text-muted-foreground">{teamMember.email}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation Section */}
        {filteredNav.length > 0 && (
          <CommandGroup heading="Navigation">
            {filteredNav.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="gap-3 cursor-pointer"
              >
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Settings Section */}
        {filteredSettings.length > 0 && (
          <CommandGroup heading="Settings">
            {filteredSettings.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="gap-3 cursor-pointer"
              >
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
