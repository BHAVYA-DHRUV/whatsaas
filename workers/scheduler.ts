/**
 * Lightweight scheduler: triggers campaign processing and optional webhook retry sweep.
 */
import 'dotenv/config';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET;
const INTERVAL_MS = Number(process.env.SCHEDULER_INTERVAL_MS || 60_000);

const endpoints = ['/api/campaigns/process'];

async function call(path: string) {
  if (!CRON_SECRET) return;
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${CRON_SECRET}` } });
    console.log(`[scheduler] ${path} → ${res.status}`);
  } catch (e) {
    console.error(`[scheduler] ${path} failed`, e);
  }
}

async function run() {
  for (const path of endpoints) {
    await call(path);
  }
}

console.log(`[scheduler] every ${INTERVAL_MS}ms`);
void run();
setInterval(run, INTERVAL_MS);
