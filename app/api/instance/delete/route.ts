import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { ActivityType, evolutionInstances } from '@/lib/db/schema'; 
import { eq, and } from 'drizzle-orm';
import { logActivity } from '@/lib/db/activity';
import { getEvolutionConfig } from '@/lib/whatsapp/config';

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

export async function DELETE(request: NextRequest) {
  try {
    const evoConfig = await getEvolutionConfig();
    const user = await getUser();
    const team = await getTeamForUser();
    if (!team || !user) {
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
      columns: { id: true, integration: true, metaToken: true, metaWabaId: true }
    });

    if (!dbInstance) {
      return NextResponse.json({ error: 'Instance not found or unauthorized' }, { status: 404 });
    }

    
    if (dbInstance.integration === 'META-CLOUD') {
      if (dbInstance.metaWabaId && dbInstance.metaToken) {
        try {
          await fetch(
            `https://graph.facebook.com/v21.0/${dbInstance.metaWabaId}/subscribed_apps`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${dbInstance.metaToken}` },
              signal: AbortSignal.timeout(10000),
            }
          );
          console.log(`Unsubscribed webhooks for META-CLOUD instance ${instanceName}`);
        } catch (e: any) {
          console.warn(`Warning: failed to unsubscribe Meta webhook for ${instanceName}:`, e.message);
        }
      }

      await db.delete(evolutionInstances).where(eq(evolutionInstances.id, dbInstance.id));
      await logActivity(team.id, user.id, ActivityType.DELETE_INSTANCE);
      return NextResponse.json({ message: 'Instance deleted successfully.' });
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

    if (!logoutResponse.ok && logoutResponse.status !== 404) {
        const errorData = await logoutResponse.json().catch(() => ({}));
        console.warn(`Warning during logout for ${instanceName} (Status ${logoutResponse.status}):`, errorData);

    } else {
        console.log(`Logout successful or instance already disconnected for ${instanceName}.`);
    }

    console.log(`Attempting to delete instance: ${instanceName}`);
    const deleteResponse = await fetch(
      `${evoConfig.apiUrl}/instance/delete/${instanceName}`,
      {
        method: 'DELETE',
        headers: { 'apikey': evoConfig.apiKey },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => ({}));
        if (deleteResponse.status !== 404) {
             console.error(`Error deleting ${instanceName} from Evolution API (Status ${deleteResponse.status}):`, errorData);
             return NextResponse.json({ error: errorData.error || errorData.response?.message || 'Failed to delete from Evolution API.' }, { status: deleteResponse.status });
        } else {
             console.log(`Instance ${instanceName} not found on Evolution API (404), proceeding with local removal.`);
        }
    } else {
        console.log(`Successfully deleted ${instanceName} from Evolution API.`);
        await logActivity(team.id, user.id, ActivityType.DELETE_INSTANCE);
    }

    console.log(`[INSTANCE_DELETED] Deleted instance ${instanceName}`);
    console.log(`Deleting instance ${dbInstance.id} from local database.`);
    await db.delete(evolutionInstances)
      .where(eq(evolutionInstances.id, dbInstance.id));

    return NextResponse.json({ message: 'Instance deleted successfully.' });

  } catch (error: any) {
    console.error('Error in /api/instance/delete:', error.message);
    if (isEvolutionUnavailableError(error)) {
      return NextResponse.json({ error: 'Evolution API is unavailable. Start the service and try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
