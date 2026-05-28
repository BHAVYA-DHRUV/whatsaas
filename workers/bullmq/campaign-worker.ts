import 'dotenv/config';
import { Worker } from 'bullmq';
import { getBullConnection } from '../../lib/queue/redis-connection';
import { QUEUE_NAMES } from '../../lib/queue/queues';
import { moveToDeadLetter } from '../../lib/queue/enqueue';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const CRON_SECRET = process.env.CRON_SECRET;

async function processCampaigns() {
  if (!CRON_SECRET) throw new Error('CRON_SECRET not set');
  const res = await fetch(`${BASE_URL}/api/campaigns/process`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });
  if (!res.ok) throw new Error(`Campaign API ${res.status}`);
  return res.json();
}

const worker = new Worker(
  QUEUE_NAMES.campaigns,
  async (job) => {
    console.log(`[campaign-worker] ${job.name} ${job.id}`);
    return processCampaigns();
  },
  { connection: getBullConnection(), concurrency: 2 }
);

worker.on('failed', async (job, err) => {
  console.error('[campaign-worker] failed', job?.id, err.message);
  if (job) await moveToDeadLetter(QUEUE_NAMES.campaigns, job.data, err.message);
});

// Repeat sweep every 30s
async function bootstrap() {
  const { Queue } = await import('bullmq');
  const q = new Queue(QUEUE_NAMES.campaigns, { connection: getBullConnection() });
  await q.add('sweep', {}, { repeat: { every: 30_000 }, jobId: 'campaign-repeat' });
  console.log('[campaign-worker] listening + repeat every 30s');
}

bootstrap().catch(console.error);
