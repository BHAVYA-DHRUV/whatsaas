import 'dotenv/config';
import { Worker } from 'bullmq';
import { getBullConnection } from '../../lib/queue/redis-connection';
import { QUEUE_NAMES } from '../../lib/queue/queues';

/** Monitors dead-letter queue for alerting / manual replay. */
const worker = new Worker(
  QUEUE_NAMES.dlq,
  async (job) => {
    console.error('[dlq]', JSON.stringify(job.data));
    if (process.env.HEALTH_ALERT_WEBHOOK_URL) {
      await fetch(process.env.HEALTH_ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `DLQ: ${job.data?.originalQueue}`, data: job.data }),
      }).catch(() => {});
    }
    return { logged: true };
  },
  { connection: getBullConnection() }
);

console.log('[retry-worker] DLQ listener started');
