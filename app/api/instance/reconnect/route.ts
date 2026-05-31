import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { evolutionInstances } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getEvolutionConfig } from '@/lib/whatsapp/config';

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

export async function POST(request: NextRequest) {
  try {
    const evoConfig = await getEvolutionConfig();
    const user = await getUser();
    const team = await getTeamForUser();
    if (!team || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const instanceName = request.nextUrl.searchParams.get('instanceName');
    if (!instanceName) return NextResponse.json({ error: 'Instance name is required' }, { status: 400 });

    const dbInstance = await db.query.evolutionInstances.findFirst({
      where: and(eq(evolutionInstances.teamId, team.id), eq(evolutionInstances.instanceName, instanceName)),
      columns: { id: true }
    });

    if (!dbInstance) return NextResponse.json({ error: 'Instance not found or unauthorized' }, { status: 404 });

    if (!evoConfig.apiKey) throw new Error('Evolution API key is not configured.');

    try {
      // Trigger connect to refresh QR / pairing
      const resp = await fetch(`${evoConfig.apiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { apikey: evoConfig.apiKey },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });

      const raw = await resp.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw }; }

      if (!resp.ok) {
        console.error('Reconnect failed:', data);
        return NextResponse.json({ error: data.error || 'Failed to reconnect' }, { status: resp.status || 500 });
      }

      return NextResponse.json({ success: true, qrcode: { base64: data.base64 || data.qrcode?.base64 || null, code: data.code || data.qrcode?.code || null, pairingCode: data.pairingCode || data.qrcode?.pairingCode || null } });
    } catch (err: any) {
      if (isEvolutionUnavailableError(err)) return NextResponse.json({ error: 'Evolution API is unavailable.' }, { status: 503 });
      throw err;
    }
  } catch (error: any) {
    console.error('Error in /api/instance/reconnect:', error.message);
    if (isEvolutionUnavailableError(error)) return NextResponse.json({ error: 'Evolution API is unavailable.' }, { status: 503 });
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
