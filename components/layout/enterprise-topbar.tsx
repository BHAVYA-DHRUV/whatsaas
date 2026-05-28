'use client';

import { useState } from 'react';
import { Bell, Search, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from '@/i18n/routing';
import useSWR from 'swr';
import { signOut } from '@/app/[locale]/(login)/actions';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function EnterpriseTopbar({ title }: { title?: string }) {
  const router = useRouter();
  const { data: user } = useSWR<{ name?: string; email: string }>('/api/user', fetcher);
  const { data: team } = useSWR<{ name?: string; planName?: string }>('/api/team', fetcher);
  const [search, setSearch] = useState('');

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>}
        {team?.name && !title && (
          <p className="truncate text-sm text-muted-foreground">
            {team.name}
            {team.planName ? ` · ${team.planName}` : ''}
          </p>
        )}
      </div>

      <div className="hidden max-w-sm flex-1 md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats, contacts…"
            className="h-9 rounded-full border-border/60 bg-muted/50 pl-9"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarImage alt={user?.name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.email?.slice(0, 2).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <form action={handleSignOut} className="w-full">
                <button type="submit" className="w-full text-left text-sm">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
