import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { evolutionInstances } from '../lib/db/schema';

async function main() {
  const rows = await db.select().from(evolutionInstances);
  console.log('Evolution Instances in DB:', JSON.stringify(rows, null, 2));
}

main().catch(console.error);
