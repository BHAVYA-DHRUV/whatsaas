import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  
  const instanceName = 'team-3-sales-head';
  
  for (let i = 1; i <= 10; i++) {
    console.log(`[Attempt ${i}/10] Fetching QR code...`);
    try {
      const qrResult = await EvolutionSDK.fetchQR(instanceName);
      console.log('QR Code response:', JSON.stringify(qrResult, null, 2));
      if (qrResult.base64 || qrResult.qrcode?.base64) {
        console.log('Success! QR code received.');
        break;
      }
    } catch (err) {
      console.error('Error fetching QR:', err.message);
    }
    console.log('Waiting 3 seconds before next attempt...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

main().catch(console.error);
