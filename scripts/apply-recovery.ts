import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('POSTGRES_URL required');
  process.exit(1);
}

async function main() {
  const sqlPath = join(process.cwd(), 'scripts', 'db', 'migrate-recovery.sql');
  const body = readFileSync(sqlPath, 'utf8');
  const sql = postgres(url!, { max: 1 });
  try {
    await sql.unsafe(body);
    console.log('Recovery SQL applied successfully.');
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
