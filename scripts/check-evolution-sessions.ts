import postgres from 'postgres';

async function main() {
  const url = 'postgresql://postgres:Postgresadmin2026@localhost:5433/whatsaas_db';
  const sql = postgres(url);
  try {
    const sessions = await sql`
      SELECT "id", "instanceId" 
      FROM evolution."Session";
    `;
    console.log('Sessions in DB:', sessions);
  } catch (err) {
    console.error('Failed to get sessions:', err.message);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
