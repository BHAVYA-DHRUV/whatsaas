import { getQueues } from './queues';
import { isQueueEnabled } from './redis-connection';
import { tenantJobId } from '@/lib/auth/tenant';

export type AIQueuePayload = {
  teamId: number;
  chatId: number;
  instanceId: number;
};

export type AutomationQueuePayload = {
  teamId: number;
  chatId: number;
  automationId: number;
  nodeId?: string;
};

/** Enqueue AI processing (tenant-scoped). Returns false → caller should use in-process debounce. */
export async function enqueueAIJob(payload: AIQueuePayload): Promise<boolean> {
  if (!isQueueEnabled()) return false;
  const q = getQueues();
  if (!q) return false;
  await q.ai.add(
    'process',
    payload,
    {
      jobId: tenantJobId(payload.teamId, 'ai', String(payload.chatId)),
      delay: Number(process.env.AI_DEBOUNCE_MS || 5000),
      removeOnComplete: true,
    }
  );
  return true;
}

export async function enqueueAutomationJob(payload: AutomationQueuePayload, delayMs = 0) {
  if (!isQueueEnabled()) return false;
  const q = getQueues();
  if (!q) return false;
  await q.automation.add('run', payload, {
    delay: delayMs,
    jobId: tenantJobId(
      payload.teamId,
      'automation',
      `${payload.automationId}-${payload.chatId}-${payload.nodeId ?? 'root'}`
    ),
  });
  return true;
}

export async function enqueueCampaignSweep() {
  if (!isQueueEnabled()) return false;
  const q = getQueues();
  if (!q) return false;
  await q.campaigns.add('sweep', {}, { jobId: `campaign-sweep-${Date.now()}` });
  return true;
}

export async function moveToDeadLetter(originalQueue: string, payload: unknown, error: string) {
  if (!isQueueEnabled()) return;
  const q = getQueues();
  if (!q) return;
  await q.dlq.add('failed', { originalQueue, payload, error, at: new Date().toISOString() });
}
