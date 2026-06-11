import postgres from 'postgres';

async function main() {
  const url = 'postgresql://postgres:Postgresadmin2026@localhost:5433/whatsaas_db';
  console.log('Connecting to Docker Postgres for cleaning...');
  const sql = postgres(url);
  try {
    // Disable triggers/constraints temporarily if needed, or delete in order
    // Order: dependent tables first
    const tables = [
      'Session', 'MessageUpdate', 'Media', 'Message', 'Chat', 'Contact', 
      'Setting', 'Chatwoot', 'Label', 'Proxy', 'Rabbitmq', 'Sqs', 
      'Websocket', 'OpenaiSetting', 'OpenaiBot', 'OpenaiCreds', 'Template', 
      'DifySetting', 'Dify', 'IntegrationSession', 'EvolutionBotSetting', 
      'EvolutionBot', 'FlowiseSetting', 'Flowise', 'TypebotSetting', 
      'Typebot', 'IsOnWhatsapp', 'Instance'
    ];
    
    for (const table of tables) {
      try {
        const countBefore = await sql`SELECT count(*)::int as cnt FROM evolution.${sql(table)}`;
        console.log(`Clearing evolution."${table}" (currently ${countBefore[0].cnt} rows)...`);
        await sql`TRUNCATE TABLE evolution.${sql(table)} CASCADE;`;
      } catch (e) {
        console.log(`Failed to clear evolution."${table}":`, e instanceof Error ? e.message : String(e));
      }
    }
    console.log('Evolution schema cleared successfully!');
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
