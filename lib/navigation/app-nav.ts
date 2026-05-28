import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Inbox,
  Kanban,
  Users,
  Megaphone,
  Workflow,
  BarChart3,
  Settings,
  Phone,
  FileText,
} from 'lucide-react';
import type { MemberPermissions } from '@/lib/permissions';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Permission key from MemberPermissions or 'always' */
  permission?: keyof MemberPermissions | 'always';
};

export const MAIN_NAV: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'always' },
  { title: 'Inbox', href: '/inbox', icon: Inbox, permission: 'always' },
  { title: 'Pipeline', href: '/pipeline', icon: Kanban, permission: 'contacts' },
  { title: 'Contacts', href: '/contacts', icon: Users, permission: 'contacts' },
  { title: 'Campaigns', href: '/campaigns', icon: Megaphone, permission: 'campaigns' },
  { title: 'Automation', href: '/automation', icon: Workflow, permission: 'automation' },
  { title: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'always' },
];

export const SECONDARY_NAV: NavItem[] = [
  { title: 'Calls', href: '/calls', icon: Phone, permission: 'voiceCalls' },
  { title: 'Templates', href: '/templates', icon: FileText, permission: 'templates' },
  { title: 'Settings', href: '/settings', icon: Settings, permission: 'settings' },
];

export function filterNavByPermissions(
  items: NavItem[],
  permissions: MemberPermissions
): NavItem[] {
  return items.filter((item) => {
    if (!item.permission || item.permission === 'always') return true;
    return Boolean(permissions[item.permission]);
  });
}
