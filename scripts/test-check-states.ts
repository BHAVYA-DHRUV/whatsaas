import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  
  try {
    const state1 = await EvolutionSDK.getConnectionState('team-3-sales-head');
    console.log('State for team-3-sales-head:', state1);
  } catch (e) {
    console.error('Failed to get state for team-3-sales-head:', e instanceof Error ? e.message : String(e));
  }

  try {
    const state2 = await EvolutionSDK.getConnectionState('team-3-team-lead');
    console.log('State for team-3-team-lead:', state2);
  } catch (e) {
    console.error('Failed to get state for team-3-team-lead:', e instanceof Error ? e.message : String(e));
  }
}

main().catch(console.error);
