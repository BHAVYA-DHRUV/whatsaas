import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { evolutionInstances, webhookEvents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { pusherServer } from '@/lib/pusher-server';

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

export async function POST(request: NextRequest) {
  try {
    const evoConfig = await getEvolutionConfig();
    if (!evoConfig.apiKey) throw new Error('Evolution API key not configured');

    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const instanceName = body.instanceName || request.nextUrl.searchParams.get('instanceName');
    if (!instanceName) return NextResponse.json({ error: 'instanceName is required' }, { status: 400 });

    const dbInstance = await db.query.evolutionInstances.findFirst({
      where: and(eq(evolutionInstances.teamId, team.id), eq(evolutionInstances.instanceName, instanceName)),
      columns: { id: true }
    });
    if (!dbInstance) return NextResponse.json({ error: 'Instance not found or unauthorized' }, { status: 404 });

    let connectResponse: Response;
    try {
      connectResponse = await fetch(`${evoConfig.apiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { apikey: evoConfig.apiKey },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      if (isEvolutionUnavailableError(error)) {
        return NextResponse.json({ error: `Evolution API is unavailable at ${evoConfig.apiUrl}` }, { status: 503 });
      }
      throw error;
    }

    const raw = await connectResponse.text();
    let data: any = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw }; }

    if (!connectResponse.ok) {
      return NextResponse.json({ error: data.error || 'Failed to request QR from Evolution API' }, { status: connectResponse.status });
    }

    // notify clients
    try {
      await pusherServer.trigger(`team-${team.id}`, 'qr-update-needed', { instance: instanceName });
    } catch (e) {
      console.error('[QR Refresh] pusher trigger failed', (e as Error).message);
    }

    try {
      await db.insert(webhookEvents).values({
        teamId: team.id,
        instanceName,
        event: 'qrcode.requested',
        messageId: null,
        remoteJid: null,
        status: 'processed'
      });
    } catch (_e) {}

    return NextResponse.json({
      base64: data.base64 || data.qrcode?.base64 || null,
      code: data.code || data.qrcode?.code || null,
      pairingCode: data.pairingCode || data.qrcode?.pairingCode || null,
    });
  } catch (error: any) {
    console.error('Error in /api/instance/qr/refresh:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
