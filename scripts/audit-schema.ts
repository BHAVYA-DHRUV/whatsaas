/**
 * Compare live PostgreSQL columns vs Drizzle schema expectations.
 * Run: npx tsx scripts/audit-schema.ts
 */
import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('POSTGRES_URL or DATABASE_URL required');
  process.exit(1);
}

/** Critical columns that caused production errors when missing. */
const CRITICAL_CHECKS: Array<{ table: string; column: string }> = [
  { table: 'plans', column: 'gateway_id' },
  { table: 'teams', column: 'onboarding_completed_at' },
  { table: 'teams', column: 'gateway_type' },
  { table: 'teams', column: 'gateway_customer_id' },
  { table: 'teams', column: 'gateway_subscription_id' },
];

const EXPECTED_TABLES = [
  'users',
  'plans',
  'payment_gateways',
  'teams',
  'team_members',
  'chats',
  'messages',
  'contacts',
  'evolution_instances',
  'automations',
  'ai_configs',
  'ai_tools',
  'ai_sessions',
  'webhook_events',
  'call_credits',
  'twilio_configs',
];

async function main() {
  const sql = postgres(url!, { max: 1 });
  const issues: string[] = [];
  const ok: string[] = [];

  try {
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tableSet = new Set(tables.map((t) => t.table_name));

    for (const t of EXPECTED_TABLES) {
      if (!tableSet.has(t)) {
        issues.push(`MISSING TABLE: ${t}`);
      } else {
        ok.push(`table: ${t}`);
      }
    }

    for (const { table, column } of CRITICAL_CHECKS) {
      const rows = await sql<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
      `;
      const cols = new Set(rows.map((r) => r.column_name));
      if (!cols.has(column)) {
        issues.push(`MISSING COLUMN: ${table}.${column}`);
      } else {
        ok.push(`column: ${table}.${column}`);
      }
    }

    const migrationRows = await sql<{ hash: string; created_at: string }[]>`
      SELECT hash, created_at::text FROM drizzle.__drizzle_migrations ORDER BY created_at
    `.catch(() => [] as { hash: string; created_at: string }[]);

    const report = [
      '# Schema audit (live DB)',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Critical issues',
      issues.length ? issues.map((i) => `- ${i}`).join('\n') : '- None',
      '',
      '## Verified',
      ...ok.slice(0, 30).map((o) => `- ${o}`),
      ok.length > 30 ? `- … and ${ok.length - 30} more` : '',
      '',
      '## Applied migrations (drizzle)',
      migrationRows.length
        ? migrationRows.map((m) => `- ${m.hash} @ ${m.created_at}`).join('\n')
        : '- drizzle.__drizzle_migrations not found (run drizzle-kit migrate)',
      '',
      '## Recovery',
      'Run: `npx tsx scripts/apply-recovery.ts` or `psql -f scripts/db/migrate-recovery.sql`',
      '',
    ].join('\n');

    const outDir = join(process.cwd(), 'docs', 'enterprise');
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'SCHEMA-AUDIT.md');
    writeFileSync(outPath, report);

    console.log(report);
    console.log(`\nWrote ${outPath}`);

    if (issues.length) {
      process.exitCode = 1;
    }
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
