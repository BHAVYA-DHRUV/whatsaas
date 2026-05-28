import 'dotenv/config';
import { Worker } from 'bullmq';
import { getBullConnection } from '../../lib/queue/redis-connection';
import { QUEUE_NAMES } from '../../lib/queue/queues';
import { moveToDeadLetter, type AIQueuePayload } from '../../lib/queue/enqueue';
import { db } from '../../lib/db/drizzle';
import { messages, chats, evolutionInstances } from '../../lib/db/schema';
import { and, desc, eq, gt } from 'drizzle-orm';
import { processAIMessage } from '../../lib/plugins/ai-chat/service';

async function runAIJob(data: AIQueuePayload) {
  const { teamId, chatId, instanceId } = data;

  const lastOwnMessage = await db.query.messages.findFirst({
    where: and(eq(messages.chatId, chatId), eq(messages.fromMe, true)),
    orderBy: [desc(messages.timestamp)],
    columns: { timestamp: true },
  });

  const pendingWhere = lastOwnMessage
    ? and(eq(messages.chatId, chatId), eq(messages.fromMe, false), gt(messages.timestamp, lastOwnMessage.timestamp))
    : and(eq(messages.chatId, chatId), eq(messages.fromMe, false));

  const pendingMessages = await db.query.messages.findMany({
    where: pendingWhere,
    orderBy: [messages.timestamp],
    columns: { text: true, mediaUrl: true },
    limit: 20,
  });

  if (pendingMessages.length === 0) return { skipped: true };

  const combinedText = pendingMessages.map((m) => m.text || '[media]').join('\n');
  const latestMedia = [...pendingMessages].reverse().find((m) => m.mediaUrl);

  const aiResponse = await processAIMessage(teamId, chatId, combinedText, latestMedia?.mediaUrl);
  if (!aiResponse) return { sent: false };

  const instance = await db.query.evolutionInstances.findFirst({
    where: and(eq(evolutionInstances.id, instanceId), eq(evolutionInstances.teamId, teamId)),
  });
  if (!instance?.accessToken) return { sent: false };

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.teamId, teamId)),
    columns: { remoteJid: true },
  });
  if (!chat) return { sent: false };

  const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance.instanceName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: instance.accessToken },
    body: JSON.stringify({
      number: chat.remoteJid.replace(/\D/g, ''),
      text: String(aiResponse),
      delay: 1000,
    }),
  });

  return { sent: true };
}

const worker = new Worker<AIQueuePayload>(
  QUEUE_NAMES.ai,
  async (job) => {
    console.log(`[ai-worker] team=${job.data.teamId} chat=${job.data.chatId}`);
    return runAIJob(job.data);
  },
  { connection: getBullConnection(), concurrency: 5 }
);

worker.on('failed', async (job, err) => {
  console.error('[ai-worker] failed', err.message);
  if (job) await moveToDeadLetter(QUEUE_NAMES.ai, job.data, err.message);
});

console.log('[ai-worker] started');
