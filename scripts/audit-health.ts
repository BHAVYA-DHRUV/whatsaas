/**
 * Phase 1 infrastructure audit — run: npm run audit:health
 */
import 'dotenv/config';

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function add(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
}

add('POSTGRES_URL', Boolean(process.env.POSTGRES_URL), process.env.POSTGRES_URL ? 'set' : 'missing');
add('AUTH_SECRET', Boolean(process.env.AUTH_SECRET), process.env.AUTH_SECRET ? 'set' : 'missing');
add('CRON_SECRET', Boolean(process.env.CRON_SECRET), process.env.CRON_SECRET ? 'set' : 'missing');
add('REDIS_URL', Boolean(process.env.REDIS_URL), process.env.REDIS_URL || 'optional locally');
add('EVOLUTION_API_URL', Boolean(process.env.EVOLUTION_API_URL), process.env.EVOLUTION_API_URL || 'missing');
add('OPENAI_API_KEY', Boolean(process.env.OPENAI_API_KEY), process.env.OPENAI_API_KEY ? 'set' : 'missing');

async function pingUrl(label: string, url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    add(label, res.ok, `${url} → ${res.status}`);
  } catch (e) {
    add(label, false, `${url} → ${String(e)}`);
  }
}

async function main() {
  await pingUrl('App health', `${(process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/health`);
  if (process.env.EVOLUTION_API_URL) {
    await pingUrl('Evolution', process.env.EVOLUTION_API_URL);
  }

  console.log('\n=== WhatSaaS Infrastructure Audit ===\n');
  for (const c of checks) {
    console.log(`${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`);
  }
  const failed = checks.filter((c) => !c.ok).length;
  console.log(`\n${failed} issue(s) found.\n`);
  process.exit(failed > 3 ? 1 : 0);
}

main();
