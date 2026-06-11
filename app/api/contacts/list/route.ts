import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { checkRoutePermission } from '@/lib/auth/permissions-guard';
import { contacts } from '@/lib/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await checkRoutePermission('contacts');
    if (error) return NextResponse.json([]);

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = CacheKeys.contactsList(team.id);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
    }

    const teamContacts = await db.query.contacts.findMany({
      where: and(eq(contacts.teamId, team.id), isNull(contacts.deletedAt)),
      orderBy: [desc(contacts.updatedAt)],
      columns: {
        id: true,
        name: true,
        notes: true,
        customData: true,
        showTimeInStage: true,
        assignedUserId: true,
        assignedDepartmentId: true,
        funnelStageId: true,
        chatId: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        assignedUser: {
          columns: { id: true, name: true, email: true }
        },
        assignedDepartment: {
          columns: { id: true, name: true }
        },
        funnelStage: {
          columns: { id: true, name: true, emoji: true, order: true }
        },
        chat: {
          columns: { remoteJid: true, profilePicUrl: true, instanceId: true },
          with: {
            instance: {
              columns: { id: true, instanceName: true }
            }
          }
        },
        contactTags: {
          with: {
            tag: {
              columns: { id: true, name: true, color: true }
            }
          }
        }
      }
    });

    const formatted = teamContacts.map(c => ({
        id: c.id,
        name: c.name,
        notes: c.notes,
        customData: c.customData,
        showTimeInStage: c.showTimeInStage,
        assignedUser: c.assignedUser,
        assignedDepartment: c.assignedDepartment,
        funnelStage: c.funnelStage,
        tags: c.contactTags.map(ct => ct.tag),
        profilePicUrl: c.chat?.profilePicUrl,
        phone: c.chat?.remoteJid.split('@')[0],
        instanceId: c.chat?.instance?.id || null,
        instanceName: c.chat?.instance?.instanceName || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    }));

    await cacheSet(cacheKey, formatted, CacheTTL.contacts);

    return NextResponse.json(formatted, { headers: { 'X-Cache': 'MISS' } });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}