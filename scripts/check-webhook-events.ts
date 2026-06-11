import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { webhookEvents } from '../lib/db/schema';
import { desc } from 'drizzle-orm';

async function main() {
  try {
    const events = await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(10);
    console.log('--- Webhook Events (latest 10) ---');
    console.log(JSON.stringify(events, null, 2));
  } catch (err) {
    console.error('Failed to query webhookEvents:', err instanceof Error ? err.message : String(err));
  }
}

main().catch(console.error);
