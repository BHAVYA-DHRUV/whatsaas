import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.POSTGRES_URL);
  try {
    const schemas = await sql`SELECT schema_name FROM information_schema.schemata;`;
    console.log('Schemas:', schemas.map(s => s.schema_name));
    
    // Check if evolution schema exists
    const hasEvolution = schemas.some(s => s.schema_name === 'evolution');
    if (!hasEvolution) {
      console.log('No "evolution" schema found.');
      return;
    }
    
    // List tables in evolution schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'evolution';
    `;
    console.log('Tables in evolution schema:', tables.map(t => t.table_name));
    
    for (const t of tables) {
      const name = t.table_name;
      // Fetch rows count
      const [countResult] = await sql`SELECT count(*)::int as cnt FROM evolution.${sql(name)}`;
      console.log(`Table evolution.${name}: ${countResult.cnt} rows`);
      if (name.toLowerCase() === 'instance') {
        const rows = await sql`SELECT * FROM evolution.${sql(name)}`;
        console.log('Instances in evolution schema:', JSON.stringify(rows, null, 2));
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
