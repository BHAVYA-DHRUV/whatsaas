import 'dotenv/config';
import { db } from '@/lib/db/drizzle';
import { evolutionInstances, webhookEvents } from '@/lib/db/schema';
import { pusherServer } from '@/lib/pusher-server';
import { getEvolutionConfig } from '@/lib/whatsapp/config';

async function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function run() {
  try {
    const evoConfig = await getEvolutionConfig();
    if (!evoConfig.apiKey) throw new Error('Evolution API key not configured');

    const instances = await db.query.evolutionInstances.findMany({
      columns: { id: true, instanceName: true, teamId: true }
    });

    for (const inst of instances) {
      try {
        const resp = await fetch(`${evoConfig.apiUrl}/instance/connect/${inst.instanceName}`, {
          method: 'GET', headers: { apikey: evoConfig.apiKey }, signal: AbortSignal.timeout(10000)
        });
        if (!resp.ok) continue;
        const data = await resp.json().catch(() => ({}));
        const base64 = data.base64 || data.qrcode?.base64 || null;
        if (base64) {
          try { await pusherServer.trigger(`team-${inst.teamId}`, 'qr-update-needed', { instance: inst.instanceName }); } catch (e) {}
          try {
            await db.insert(webhookEvents).values({ teamId: inst.teamId, instanceName: inst.instanceName, event: 'qrcode.automated', status: 'processed' });
          } catch (_) {}
        }
      } catch (e: any) {
        console.error('[qr-rotator] instance', inst.instanceName, e.message || e);
      }
      await delay(250);
    }
  } catch (err: any) {
    console.error('QR Rotator error:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  run().then(() => process.exit(0));
}
