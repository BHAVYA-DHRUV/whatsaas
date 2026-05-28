const postgres = require('postgres');
require('dotenv').config();

async function main() {
  const sql = postgres(process.env.POSTGRES_URL, { connect_timeout: 5 });
  try {
    const result = await sql`select 1 as ok`;
    console.log('DB_OK', result);
  } catch (error) {
    console.error('DB_ERR', error.message);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

main();
