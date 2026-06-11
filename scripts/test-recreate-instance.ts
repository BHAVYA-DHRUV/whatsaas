import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  
  const instanceName = 'team-3-team-lead';
  console.log(`Deleting instance: ${instanceName}`);
  try {
    try {
      const deleteResult = await EvolutionSDK.deleteInstance(instanceName);
      console.log('Delete response:', deleteResult);
    } catch (e) {
      console.log('Delete failed (might not exist on container):', e instanceof Error ? e.message : String(e));
    }
    
    console.log(`Recreating instance: ${instanceName}`);
    const createResult = await EvolutionSDK.createInstance(instanceName, {
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
    console.log('Create response:', JSON.stringify(createResult, null, 2));
    
    console.log('Waiting 3 seconds for Baileys session to initialize...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    console.log('Fetching QR code...');
    const qrResult = await EvolutionSDK.fetchQR(instanceName);
    console.log('QR Code response:', JSON.stringify(qrResult, null, 2));
  } catch (err) {
    console.error('Error during recreation/fetch:', err instanceof Error ? err.message : String(err));
  }
}

main().catch(console.error);
