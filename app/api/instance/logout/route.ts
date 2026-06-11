import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { evolutionInstances } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { QRManager } from '@/lib/whatsapp/qr-manager';
import { pusherServer } from '@/lib/pusher-server';

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

export async function POST(request: NextRequest) {
  try {
    const evoConfig = await getEvolutionConfig();
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instanceName = request.nextUrl.searchParams.get('instanceName');
    if (!instanceName) {
      return NextResponse.json({ error: 'Instance name is required' }, { status: 400 });
    }

    const dbInstance = await db.query.evolutionInstances.findFirst({
      where: and(
        eq(evolutionInstances.teamId, team.id),
        eq(evolutionInstances.instanceName, instanceName)
      ),
      columns: { id: true }
    });

    if (!dbInstance) {
      return NextResponse.json({ error: 'Instance not found or unauthorized' }, { status: 404 });
    }

    // 1. Terminate Evolution session remotely (gracefully)
    try {
      if (evoConfig.apiKey) {
        await fetch(
          `${evoConfig.apiUrl}/instance/logout/${instanceName}`,
          {
            method: 'DELETE',
            headers: { 'apikey': evoConfig.apiKey },
            signal: AbortSignal.timeout(10000),
          }
        );
      }
    } catch (evoErr) {
      console.warn(`[INSTANCE_LOGOUT] Evolution API logout call warning for ${instanceName}:`, evoErr);
    }

    // 2. Clear cached QR codes in memory and Redis
    await QRManager.invalidateQR(instanceName);

    // 3. Update database status to close
    await db.update(evolutionInstances)
      .set({ status: 'close', updatedAt: new Date() })
      .where(eq(evolutionInstances.id, dbInstance.id));

    // 4. Broadcast connection status change via Pusher/Socket
    const pusherChannel = `team-${team.id}`;
    try {
      await pusherServer.trigger(pusherChannel, 'connection-status', {
        status: 'close',
        instance: instanceName
      });
    } catch (pushErr) {
      console.error('[INSTANCE_LOGOUT] Pusher status broadcast error:', pushErr);
    }

    // 5. Structured logging
    console.log(`[INSTANCE_LOGOUT] Disconnected instance ${instanceName}`);

    return NextResponse.json({ success: true, message: 'Instance disconnected successfully.' });

  } catch (error: any) {
    console.error('Error in API /api/instance/logout:', error.message);
    if (isEvolutionUnavailableError(error)) {
      return NextResponse.json({ error: 'Evolution API is unavailable. Start the service and try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
