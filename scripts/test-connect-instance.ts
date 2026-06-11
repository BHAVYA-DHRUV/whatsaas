import 'dotenv/config';
import { getEvolutionConfig } from '../lib/whatsapp/config';

async function main() {
  const config = await getEvolutionConfig();
  console.log('Using API key:', config.apiKey);
  
  const url = `${config.apiUrl}/instance/connect/team-3-team-lead`;
  console.log('Fetching:', url);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
      },
    });
    console.log('Response status:', res.status);
    const body = await res.text();
    console.log('Response body:', body);
  } catch (err) {
    console.error('Fetch error:', err instanceof Error ? err.message : String(err));
  }
}

main().catch(console.error);
