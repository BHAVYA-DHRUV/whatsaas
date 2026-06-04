import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { webhookEvents, evolutionInstances, chats, messages } from '../lib/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  const instances = await db.select().from(evolutionInstances);
  console.log('--- Evolution Instances ---');
  console.log(JSON.stringify(instances, null, 2));

  const events = await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(20);
  console.log('--- Webhook Events (latest 20) ---');
  console.log(JSON.stringify(events, null, 2));

  const chatList = await db.select().from(chats);
  console.log('--- Chats ---', JSON.stringify(chatList, null, 2));

  const msgList = await db.select().from(messages).limit(10);
  console.log('--- Messages (latest 10) ---', JSON.stringify(msgList, null, 2));
}

main().catch(console.error);
