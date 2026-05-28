
import { NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { getEvolutionConfig } from '@/lib/whatsapp/config';

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

export async function GET(request: Request) {
  try {
    const evoConfig = await getEvolutionConfig();
    if (!evoConfig.apiKey) throw new Error("API Key not configured.");

    const team = await getTeamForUser();
    if (!team || !team.evolutionInstances || team.evolutionInstances.length === 0) {
      return NextResponse.json({ error: 'Instance not configured or unauthorized' }, { status: 404 });
    }

    const instanceName = team.evolutionInstances[0].instanceName;

    
    let connectResponse: Response;
    try {
      connectResponse = await fetch(
        `${evoConfig.apiUrl}/instance/connect/${instanceName}`,
        {
          method: 'GET',
          headers: { 'apikey': evoConfig.apiKey },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        }
      );
    } catch (error) {
      if (isEvolutionUnavailableError(error)) {
        return NextResponse.json(
          { error: `Evolution API is unavailable at ${evoConfig.apiUrl}. Start the service, then try again.` },
          { status: 503 }
        );
      }
      throw error;
    }

    if (!connectResponse.ok) {
        const error = await connectResponse.json();
        console.error(`Failed to fetch QR Code for ${instanceName}:`, error);
        return NextResponse.json({ error: 'Failed to fetch QR Code from API.' }, { status: 502 });
    }

    const qrData = await connectResponse.json();

    
    return NextResponse.json({
      base64: qrData.base64 || qrData.qrcode?.base64 || null,
      code: qrData.code || qrData.qrcode?.code || null,
      pairingCode: qrData.pairingCode || qrData.qrcode?.pairingCode || null,
    });

  } catch (error: any) {
    console.error('Error fetching QR Code:', error.message);
    if (isEvolutionUnavailableError(error)) {
      return NextResponse.json({ error: 'Evolution API is unavailable. Start the service and try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
