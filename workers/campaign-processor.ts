/**
 * Polls the campaign processor API on an interval.
 * Requires BASE_URL and CRON_SECRET in environment.
 */
import 'dotenv/config';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET;
const INTERVAL_MS = Number(process.env.CAMPAIGN_WORKER_INTERVAL_MS || 30_000);

async function tick() {
  if (!CRON_SECRET) {
    console.error('[campaign-worker] CRON_SECRET is not set');
    return;
  }

  const url = `${BASE_URL}/api/campaigns/process`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const body = await res.text();
    console.log(`[campaign-worker] ${res.status} ${body.slice(0, 500)}`);
  } catch (err) {
    console.error('[campaign-worker] request failed:', err);
  }
}

console.log(`[campaign-worker] starting — interval ${INTERVAL_MS}ms → ${BASE_URL}`);
void tick();
setInterval(tick, INTERVAL_MS);
