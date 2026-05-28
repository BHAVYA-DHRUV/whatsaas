import { Queue } from 'bullmq';
import { getBullConnection, isQueueEnabled } from './redis-connection';

export const QUEUE_NAMES = {
  campaigns: 'whats-saas-campaigns',
  ai: 'whats-saas-ai',
  automation: 'whats-saas-automation',
  scheduler: 'whats-saas-scheduler',
  dlq: 'whats-saas-dlq',
} as const;

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 3000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

function createQueue(name: string) {
  return new Queue(name, {
    connection: getBullConnection(),
    defaultJobOptions,
  });
}

let queues: Record<string, Queue> | null = null;

export function getQueues() {
  if (!isQueueEnabled()) return null;
  if (!queues) {
    queues = {
      campaigns: createQueue(QUEUE_NAMES.campaigns),
      ai: createQueue(QUEUE_NAMES.ai),
      automation: createQueue(QUEUE_NAMES.automation),
      scheduler: createQueue(QUEUE_NAMES.scheduler),
      dlq: createQueue(QUEUE_NAMES.dlq),
    };
  }
  return queues;
}
