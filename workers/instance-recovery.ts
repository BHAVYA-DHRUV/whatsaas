import 'dotenv/config';
import { db } from '@/lib/db/drizzle';
import { evolutionInstances } from '@/lib/db/schema';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { pusherServer } from '@/lib/pusher-server';

async function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

async function checkAndRecoverInstance(instance: { id: number; instanceName: string; teamId: number; integration: string | null }, evoConfig: { apiUrl: string; apiKey: string }) {
  try {
    // Skip META-CLOUD instances as they use different auth
    if (instance.integration === 'META-CLOUD') {
      return;
    }

    // Check current connection state
    const stateResponse = await fetch(
      `${evoConfig.apiUrl}/instance/connectionState/${instance.instanceName}`,
      { headers: { 'apikey': evoConfig.apiKey }, cache: 'no-store', signal: AbortSignal.timeout(10000) }
    );

    if (!stateResponse.ok) {
      console.warn(`[instance-recovery] Failed to check state for ${instance.instanceName}: ${stateResponse.status}`);
      return;
    }

    const stateData = await stateResponse.json();
    const currentState = stateData.instance?.state || 'unknown';

    // If instance is disconnected or in error state, attempt recovery
    if (currentState === 'close' || currentState === 'disconnected' || currentState === 'error') {
      console.log(`[instance-recovery] Attempting recovery for ${instance.instanceName} (state: ${currentState})`);

      // Attempt to reconnect
      const reconnectResponse = await fetch(
        `${evoConfig.apiUrl}/instance/connect/${instance.instanceName}`,
        { method: 'GET', headers: { 'apikey': evoConfig.apiKey }, cache: 'no-store', signal: AbortSignal.timeout(15000) }
      );

      if (reconnectResponse.ok) {
        const reconnectData = await reconnectResponse.json().catch(() => ({}));
        const base64 = reconnectData.base64 || reconnectData.qrcode?.base64 || null;
        
        // Notify clients that QR is available
        if (base64) {
          try {
            await pusherServer.trigger(`team-${instance.teamId}`, 'qr-update-needed', { instance: instance.instanceName });
            console.log(`[instance-recovery] QR generated for ${instance.instanceName}`);
          } catch (e) {
            console.error(`[instance-recovery] Failed to trigger pusher for ${instance.instanceName}:`, e);
          }
        } else {
          // Instance might be already connected, check again
          console.log(`[instance-recovery] No QR for ${instance.instanceName}, checking state again`);
        }
      } else {
        console.warn(`[instance-recovery] Reconnect failed for ${instance.instanceName}: ${reconnectResponse.status}`);
      }
    }
  } catch (error) {
    if (isEvolutionUnavailableError(error)) {
      console.error(`[instance-recovery] Evolution API unavailable for ${instance.instanceName}`);
    } else {
      console.error(`[instance-recovery] Error processing ${instance.instanceName}:`, error);
    }
  }
}

async function run() {
  try {
    const evoConfig = await getEvolutionConfig();
    if (!evoConfig.apiKey) {
      console.error('[instance-recovery] Evolution API key not configured');
      return;
    }

    const instances = await db.query.evolutionInstances.findMany({
      columns: { id: true, instanceName: true, teamId: true, integration: true }
    });

    console.log(`[instance-recovery] Checking ${instances.length} instances for recovery`);

    for (const inst of instances) {
      await checkAndRecoverInstance(inst, evoConfig);
      await delay(500); // Small delay between instances to avoid overwhelming the API
    }

    console.log('[instance-recovery] Recovery check completed');
  } catch (err: any) {
    console.error('[instance-recovery] Fatal error:', err.message || err);
  }
}

if (require.main === module) {
  run().then(() => process.exit(0));
}
