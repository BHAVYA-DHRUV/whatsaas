import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';
import { EvolutionSDK } from '../lib/whatsapp/evolution-sdk';

async function main() {
  const config = await getEvolutionConfig();
  console.log('API Key:', config.apiKey);
  console.log('Webhook URL:', config.webhookUrl);
  console.log('Webhook Token:', config.webhookToken);

  const instanceName = 'team-3-sales-head';
  
  const evolutionPayload: Record<string, unknown> = {
    instanceName,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    webhook: {
      enabled: true,
      url: config.webhookUrl,
      headers: {
        apikey: config.webhookToken || '',
      },
      byEvents: false,
      base64: true,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CHATS_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'CONTACTS_UPDATE',
      ],
    },
    rejectCall: false,
    groupsIgnore: true,
    alwaysOnline: true,
    readMessages: false,
    readStatus: false,
  };

  try {
    console.log('Attempting to recreate instance via SDK...');
    const res = await EvolutionSDK.createInstance(instanceName, evolutionPayload);
    console.log('Recreate result:', JSON.stringify(res, null, 2));
  } catch (error) {
    console.error('Recreate error:', error instanceof Error ? error.message : String(error));
  }
}

main().catch(console.error);
