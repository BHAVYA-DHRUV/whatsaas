import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  
  const instanceName = 'team-3-team-lead';
  console.log(`Logging out instance: ${instanceName}`);
  try {
    try {
      const logoutResult = await EvolutionSDK.logoutInstance(instanceName);
      console.log('Logout response:', logoutResult);
    } catch (e) {
      console.log('Logout failed:', e.message);
    }
    
    console.log('Waiting 3 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    console.log('Fetching QR code...');
    const qrResult = await EvolutionSDK.fetchQR(instanceName);
    console.log('QR Code response:', JSON.stringify(qrResult, null, 2));
  } catch (err) {
    console.error('Error during logout/connect:', err.message);
  }
}

main().catch(console.error);
