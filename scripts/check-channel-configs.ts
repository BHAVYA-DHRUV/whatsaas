import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { channelConfigs } from '../lib/db/schema';

async function main() {
  const rows = await db.select().from(channelConfigs);
  console.log('Channel Configs in DB:', JSON.stringify(rows, null, 2));
}

main().catch(console.error);
