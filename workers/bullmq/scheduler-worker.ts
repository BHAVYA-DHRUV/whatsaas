import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import { getBullConnection } from '../../lib/queue/redis-connection';
import { QUEUE_NAMES } from '../../lib/queue/queues';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET;

async function tick() {
  const headers: Record<string, string> = {};
  if (CRON_SECRET) headers.Authorization = `Bearer ${CRON_SECRET}`;
  await fetch(`${BASE_URL}/api/campaigns/process`, { headers });
  return { ok: true, at: new Date().toISOString() };
}

const worker = new Worker(QUEUE_NAMES.scheduler, async () => tick(), {
  connection: getBullConnection(),
});

async function bootstrap() {
  const q = new Queue(QUEUE_NAMES.scheduler, { connection: getBullConnection() });
  await q.add('heartbeat', {}, { repeat: { every: 60_000 }, jobId: 'scheduler-heartbeat' });
  console.log('[scheduler-worker] repeat every 60s');
}

bootstrap().catch(console.error);
