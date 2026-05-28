import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
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

    if (!evoConfig.apiKey) throw new Error("Evolution API key is not configured.");

    
    let logoutResponse: Response;
    try {
      logoutResponse = await fetch(
        `${evoConfig.apiUrl}/instance/logout/${instanceName}`,
        {
          method: 'DELETE',
          headers: { 'apikey': evoConfig.apiKey },
          signal: AbortSignal.timeout(10000),
        }
      );
    } catch (error) {
      if (isEvolutionUnavailableError(error)) {
        return NextResponse.json({ error: `Evolution API is unavailable at ${evoConfig.apiUrl}.` }, { status: 503 });
      }
      throw error;
    }

    const data = await logoutResponse.json();

    if (!logoutResponse.ok) {
        console.error(`Failed to disconnect ${instanceName} via API:`, data);
        return NextResponse.json({ error: data.error || data.response?.message || 'Failed to disconnect from Evolution API.' }, { status: logoutResponse.status });
    }

    return NextResponse.json({ message: data.response?.message || 'Instance disconnected successfully.' });

  } catch (error: any) {
    console.error('Error in API /api/instance/logout:', error.message);
    if (isEvolutionUnavailableError(error)) {
      return NextResponse.json({ error: 'Evolution API is unavailable. Start the service and try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
