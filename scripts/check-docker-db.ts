import postgres from 'postgres';

async function main() {
  // Connect to the Docker Postgres on port 5433
  const url = 'postgresql://postgres:Postgresadmin2026@localhost:5433/whatsaas_db';
  console.log('Connecting to Docker Postgres at:', url);
  const sql = postgres(url);
  try {
    const schemas = await sql`SELECT schema_name FROM information_schema.schemata;`;
    console.log('Schemas in Docker Postgres:', schemas.map(s => s.schema_name));
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'evolution';
    `;
    console.log('Tables in evolution schema:', tables.map(t => t.table_name));
    
    if (tables.some(t => t.table_name === 'Instance')) {
      const rows = await sql`SELECT * FROM evolution."Instance";`;
      console.log('Instances inside Docker Postgres:', JSON.stringify(rows, null, 2));
    }
  } catch (err) {
    console.error('Connection failed:', err instanceof Error ? err.message : String(err));
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
