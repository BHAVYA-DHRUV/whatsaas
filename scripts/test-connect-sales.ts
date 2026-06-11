import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  
  const instanceName = 'team-3-sales-head';
  console.log(`Fetching QR code for: ${instanceName}`);
  try {
    const qrResult = await EvolutionSDK.fetchQR(instanceName);
    console.log('QR Code response:', JSON.stringify(qrResult, null, 2));
  } catch (err) {
    console.error('Error fetching QR:', err instanceof Error ? err.message : String(err));
  }
}

main().catch(console.error);
