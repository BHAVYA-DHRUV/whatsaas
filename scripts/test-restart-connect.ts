import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  
  const instanceName = 'team-3-team-lead';
  console.log(`Restarting instance: ${instanceName}`);
  try {
    const restartResult = await EvolutionSDK.restartInstance(instanceName);
    console.log('Restart response:', restartResult);
    
    console.log('Waiting 3 seconds for Baileys session to initialize...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    console.log('Fetching QR code...');
    const qrResult = await EvolutionSDK.fetchQR(instanceName);
    console.log('QR Code response:', JSON.stringify(qrResult, null, 2));
  } catch (err) {
    console.error('Error during restart/fetch:', err.message);
  }
}

main().catch(console.error);
