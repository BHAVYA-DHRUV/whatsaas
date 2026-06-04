import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { evolutionInstances } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { triggerSync } from '@/src/lib/evolution/sync';

export async function POST(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instanceId } = await request.json();
    if (!instanceId) {
      return NextResponse.json({ error: 'instanceId is required' }, { status: 400 });
    }

    const instance = await db.query.evolutionInstances.findFirst({
      where: and(
        eq(evolutionInstances.id, Number(instanceId)),
        eq(evolutionInstances.teamId, team.id)
      ),
    });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    // Trigger sync in background (fire-and-forget)
    console.log(`[AUTO SYNC ROUTE] Triggering auto-sync for instance ${instance.instanceName}...`);
    void triggerSync(team.id, instance.id, instance.instanceName, instance.accessToken || '');

    return NextResponse.json({ success: true, message: 'Sync triggered in background.' });
  } catch (error: any) {
    console.error('Error in sync-chats/auto:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
