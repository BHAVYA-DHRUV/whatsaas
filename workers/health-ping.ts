/**
 * Periodic health check against /api/health for external monitoring hooks.
 */
import 'dotenv/config';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const INTERVAL_MS = Number(process.env.HEALTH_PING_INTERVAL_MS || 120_000);
const ALERT_WEBHOOK = process.env.HEALTH_ALERT_WEBHOOK_URL;

async function ping() {
  const url = `${BASE_URL}/api/health`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[health-ping] unhealthy', res.status, data);
      await notify(`Health check failed: HTTP ${res.status}`);
      return;
    }
    if (data.status !== 'ok') {
      console.error('[health-ping] degraded', data);
      await notify(`Health degraded: ${JSON.stringify(data.checks)}`);
      return;
    }
    console.log('[health-ping] ok', new Date().toISOString());
  } catch (err) {
    console.error('[health-ping] unreachable', err);
    await notify(`Health unreachable: ${String(err)}`);
  }
}

async function notify(message: string) {
  if (!ALERT_WEBHOOK) return;
  try {
    await fetch(ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, source: 'whats-saas-health-ping' }),
    });
  } catch {
    /* ignore */
  }
}

void ping();
setInterval(ping, INTERVAL_MS);
