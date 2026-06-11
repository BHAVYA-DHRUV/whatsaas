import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { evolutionInstances } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const instanceName = 'team-3-team-lead';

  console.log(`Step 1: Deleting instance "${instanceName}" from Evolution API container...`);
  try {
    const res = await EvolutionSDK.deleteInstance(instanceName);
    console.log('Container delete response:', res);
  } catch (err: any) {
    console.warn('Container delete failed or not found:', err.message);
  }

  console.log(`Step 2: Deleting instance "${instanceName}" from host database...`);
  try {
    await db.delete(evolutionInstances).where(eq(evolutionInstances.instanceName, instanceName));
    console.log('Host DB delete complete.');
  } catch (err: any) {
    console.error('Host DB delete failed:', err.message);
  }

  console.log('Clearing complete!');
}

main().catch(console.error);
