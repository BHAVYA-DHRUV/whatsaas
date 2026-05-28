'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/interface/Logo';
import { MAIN_NAV, SECONDARY_NAV, filterNavByPermissions } from '@/lib/navigation/app-nav';
import { getPermissions, type MemberPermissions } from '@/lib/permissions';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TeamMemberRow = {
  role: string;
  permissions?: MemberPermissions | null;
};

export function EnterpriseSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: teamData } = useSWR<{ teamMembers?: (TeamMemberRow & { user?: { id: number } })[] }>(
    '/api/team',
    fetcher
  );
  const { data: user } = useSWR<{ id: number; email: string }>('/api/user', fetcher);

  const myMembership = teamData?.teamMembers?.find((tm) => tm.user?.id === user?.id);
  const permissions = getPermissions(myMembership?.role ?? 'owner', myMembership?.permissions);

  const mainItems = filterNavByPermissions(MAIN_NAV, permissions);
  const secondaryItems = filterNavByPermissions(SECONDARY_NAV, permissions);

  const isActive = (href: string) => {
    const normalized = pathname?.replace(/^\/(pt|en|es)/, '') || pathname;
    if (href === '/dashboard') return normalized === '/dashboard';
    return normalized === href || normalized?.startsWith(`${href}/`);
  };

  const NavLink = ({ href, icon: Icon, title }: (typeof MAIN_NAV)[0]) => (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
        isActive(href)
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      title={collapsed ? title : undefined}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive(href) && 'text-primary-foreground')} />
      {!collapsed && <span className="truncate">{title}</span>}
    </Link>
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-3">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 px-1">
            <Logo />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <nav className="flex flex-col gap-1">
          {mainItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="my-3 border-t border-border/60" />
        <nav className="flex flex-col gap-1">
          {secondaryItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>

      {!collapsed && (
        <div className="border-t border-border/60 p-3">
          <p className="text-xs text-muted-foreground">WhatSaaS Workspace</p>
          <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
        </div>
      )}
    </aside>
  );
}
