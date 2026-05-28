/**
 * One-shot local bootstrap: migrate → recovery → seed user → enterprise plans + branding.
 * Run: pnpm db:bootstrap
 */
import 'dotenv/config';
import { execSync } from 'node:child_process';

function run(cmd: string) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
}

async function main() {
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    console.error('Set POSTGRES_URL (or DATABASE_URL) in .env');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }

  run('npx drizzle-kit migrate');
  run('npx tsx scripts/apply-recovery.ts');

  try {
    run('npx tsx lib/db/seed.ts');
  } catch {
    console.warn('Basic seed skipped (user may already exist).');
  }

  run('npx tsx lib/db/seed-plans.ts');
  run('npx tsx scripts/audit-schema.ts');
  console.log('\nBootstrap complete. Restart dev server: pnpm dev\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
