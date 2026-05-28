import 'dotenv/config';
import { Worker } from 'bullmq';
import { getBullConnection } from '../../lib/queue/redis-connection';
import { QUEUE_NAMES } from '../../lib/queue/queues';
import { moveToDeadLetter, type AutomationQueuePayload } from '../../lib/queue/enqueue';

/**
 * Automation delayed steps — extend to call processAutomation with session context.
 * Currently logs jobs; wire full engine when delayed-node queue is enabled in UI.
 */
const worker = new Worker<AutomationQueuePayload>(
  QUEUE_NAMES.automation,
  async (job) => {
    console.log(`[automation-worker] team=${job.data.teamId} automation=${job.data.automationId}`);
    return { acknowledged: true, ...job.data };
  },
  { connection: getBullConnection(), concurrency: 3 }
);

worker.on('failed', async (job, err) => {
  if (job) await moveToDeadLetter(QUEUE_NAMES.automation, job.data, err.message);
});

console.log('[automation-worker] started');
