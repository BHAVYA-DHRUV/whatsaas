import postgres from 'postgres';

async function main() {
  const url = 'postgresql://postgres:Postgresadmin2026@localhost:5433/whatsaas_db';
  const sql = postgres(url);
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'evolution' AND table_name = 'Session';
    `;
    console.log('Columns in Session table:', columns);
    
    const sample = await sql`SELECT * FROM evolution."Session" LIMIT 1;`;
    console.log('Sample row:', sample);
  } catch (err) {
    console.error('Failed to get schema:', err instanceof Error ? err.message : String(err));
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
