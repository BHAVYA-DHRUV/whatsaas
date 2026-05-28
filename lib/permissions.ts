/** Team-level roles. Maps to enterprise RBAC: owner≈Tenant Admin, admin, manager, agent, support */
export type TeamRole = 'owner' | 'admin' | 'manager' | 'agent' | 'support';

export type ChatVisibility = 'all' | 'assigned' | 'department';

export type MemberPermissions = {
  automation: boolean;
  aiAgent: boolean;
  contacts: boolean;
  templates: boolean;
  campaigns: boolean;
  voiceCalls: boolean;
  settings: boolean;
  chatVisibility: ChatVisibility;
};

export const ROLE_PRESETS: Record<TeamRole, MemberPermissions> = {
  owner: {
    automation: true,
    aiAgent: true,
    contacts: true,
    templates: true,
    campaigns: true,
    voiceCalls: true,
    settings: true,
    chatVisibility: 'all',
  },
  admin: {
    automation: true,
    aiAgent: true,
    contacts: true,
    templates: true,
    campaigns: true,
    voiceCalls: true,
    settings: false,
    chatVisibility: 'all',
  },
  manager: {
    automation: true,
    aiAgent: true,
    contacts: true,
    templates: true,
    campaigns: true,
    voiceCalls: false,
    settings: false,
    chatVisibility: 'department',
  },
  agent: {
    automation: false,
    aiAgent: false,
    contacts: false,
    templates: false,
    campaigns: false,
    voiceCalls: false,
    settings: false,
    chatVisibility: 'assigned',
  },
  support: {
    automation: false,
    aiAgent: false,
    contacts: true,
    templates: false,
    campaigns: false,
    voiceCalls: false,
    settings: false,
    chatVisibility: 'assigned',
  },
};

/** Global platform role — users.role === 'admin' (Super Admin) */
export function isPlatformSuperAdmin(userRole: string | null | undefined): boolean {
  return userRole === 'admin';
}

export function getPermissions(role: string, customPermissions?: MemberPermissions | null): MemberPermissions {
  if (role === 'owner') return ROLE_PRESETS.owner;
  if (customPermissions) return customPermissions;
  return ROLE_PRESETS[role as TeamRole] || ROLE_PRESETS.agent;
}

export function hasPermission(
  role: string,
  permissions: MemberPermissions | null | undefined,
  resource: keyof Omit<MemberPermissions, 'chatVisibility'>
): boolean {
  if (role === 'owner') return true;
  const perms = getPermissions(role, permissions);
  return perms[resource] === true;
}

export function canSeeAllChats(role: string, permissions: MemberPermissions | null | undefined): boolean {
  if (role === 'owner') return true;
  const perms = getPermissions(role, permissions);
  return perms.chatVisibility === 'all';
}

export function getChatVisibility(role: string, permissions: MemberPermissions | null | undefined): ChatVisibility {
  if (role === 'owner') return 'all';
  const perms = getPermissions(role, permissions);
  return perms.chatVisibility;
}

export type PermissionResource = keyof Omit<MemberPermissions, 'chatVisibility'>;

export const ROUTE_PERMISSIONS: Record<string, PermissionResource> = {
  '/automation': 'automation',
  '/settings/ai': 'aiAgent',
  '/contacts': 'contacts',
  '/templates': 'templates',
  '/campaigns': 'campaigns',
  '/settings/voice': 'voiceCalls',
  '/settings': 'settings',
};
