import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  try {
    const list = await EvolutionSDK.fetchInstances();
    console.log('Instances list from container:', JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('Failed to fetch instances:', err.message);
  }
}

main().catch(console.error);
