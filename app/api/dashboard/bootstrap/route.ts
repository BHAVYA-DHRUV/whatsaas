import { NextResponse } from 'next/server';
import { sql, eq, desc, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { chats, evolutionInstances, teamMembers } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withRateLimit(request, async () => {
    try {
      const team = await getTeamForUser();
      const user = await getUser();
      
      if (!team || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const cacheKey = CacheKeys.dashboardBootstrap(team.id);
      const cached = await cacheGet<DashboardBootstrapData>(cacheKey);

      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'X-Cache': 'HIT' },
        });
      }

      // Fetch all dashboard data in parallel
      const [stats, instances, recentChats, teamMembersData] = await Promise.all([
        // Dashboard stats
        db
          .select({
            chatCount: sql<number>`count(*)::int`,
            unreadTotal: sql<number>`coalesce(sum(${chats.unreadCount}), 0)::int`,
          })
          .from(chats)
          .where(and(
            eq(chats.teamId, team.id),
            isNull(chats.deletedAt)
          )),
        
        // Instances
        db.query.evolutionInstances.findMany({
          where: eq(evolutionInstances.teamId, team.id),
          columns: {
            id: true,
            instanceName: true,
            displayName: true,
            instanceNumber: true,
            integration: true,
            createdAt: true,
          },
          orderBy: [desc(evolutionInstances.createdAt)],
          limit: 10,
        }),
        
        // Recent chats
        db.query.chats.findMany({
          where: and(
            eq(chats.teamId, team.id),
            isNull(chats.deletedAt)
          ),
          columns: {
            id: true,
            remoteJid: true,
            instanceId: true,
            name: true,
            pushName: true,
            lastMessageText: true,
            lastMessageTimestamp: true,
            unreadCount: true,
            isArchived: true,
          },
          with: {
            contact: {
              where: (contacts: any, { isNull }: any) => isNull(contacts.deletedAt),
              columns: {
                name: true,
              },
            },
          },
          orderBy: [desc(chats.lastMessageTimestamp)],
          limit: 5,
        }),
        
        // Team members
        db.query.teamMembers.findMany({
          where: eq(teamMembers.teamId, team.id),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          limit: 10,
        }),
      ]);

      console.log('[Dashboard] Recent chats query returned:', recentChats.length);
      console.log('[Dashboard] Sample chat:', recentChats[0] ? { id: recentChats[0].id, remoteJid: recentChats[0].remoteJid, isArchived: recentChats[0].isArchived } : 'No chats');
      console.log('[Dashboard] Building payload - recentChats:', recentChats.length, 'chatCount:', stats[0]?.chatCount);
      const payload: DashboardBootstrapData = {
        team: {
          id: team.id,
          name: team.name,
          planName: team.planName ?? null,
          onboardingCompletedAt: team.onboardingCompletedAt?.toISOString() ?? null,
        },
        stats: {
          chatCount: stats[0]?.chatCount ?? 0,
          unreadTotal: stats[0]?.unreadTotal ?? 0,
          instanceCount: instances.length,
          memberCount: teamMembersData.length,
        },
        instances: instances.map(inst => ({
          id: inst.id,
          name: inst.displayName || inst.instanceName,
          number: inst.instanceNumber,
          integration: inst.integration,
          createdAt: inst.createdAt.toISOString(),
        })),
        recentChats: recentChats.map(chat => {
          const phone = chat.remoteJid.split('@')[0];
          const contactName = chat.contact?.name;
          
          // Priority: contact.name > chat.name > chat.pushName > phone
          const displayName = (contactName && contactName !== phone && contactName !== `+${phone}`)
            ? contactName
            : (chat.name && chat.name !== phone && chat.name !== `+${phone}`)
              ? chat.name
              : chat.pushName || chat.name || contactName || phone || 'Unknown';
          
          return {
            id: chat.id,
            remoteJid: chat.remoteJid,
            instanceId: chat.instanceId,
            name: displayName,
            lastMessage: chat.lastMessageText,
            lastMessageTimestamp: chat.lastMessageTimestamp?.toISOString() ?? null,
            unreadCount: chat.unreadCount ?? 0,
          };
        }),
        teamMembers: teamMembersData.map(member => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
        })),
      };

      await cacheSet(cacheKey, payload, CacheTTL.contacts);

      return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching dashboard bootstrap:', message);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

type DashboardBootstrapData = {
  team: {
    id: number;
    name: string;
    planName: string | null;
    onboardingCompletedAt: string | null;
  };
  stats: {
    chatCount: number;
    unreadTotal: number;
    instanceCount: number;
    memberCount: number;
  };
  instances: Array<{
    id: number;
    name: string;
    number: string | null;
    integration: string;
    createdAt: string;
  }>;
  recentChats: Array<{
    id: number;
    remoteJid: string;
    name: string | null;
    lastMessage: string | null;
    messageType?: string;
    lastMessageTimestamp: string | null;
    unreadCount: number;
  }>;
  teamMembers: Array<{
    id: number;
    name: string | null;
    email: string;
    role: string;
  }>;
};
