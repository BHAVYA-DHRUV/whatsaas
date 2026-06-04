import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { prisma } from '../lib/prisma';
import IORedis from 'ioredis';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'verify.log');
try {
  fs.writeFileSync(LOG_FILE, ''); // Clear file on start
} catch {}

const log = {
  info: (...args: any[]) => {
    const msg = args.join(' ');
    console.log(msg);
    try { fs.appendFileSync(LOG_FILE, msg + '\n'); } catch {}
  },
  warn: (...args: any[]) => {
    const msg = 'WARN: ' + args.join(' ');
    console.warn(msg);
    try { fs.appendFileSync(LOG_FILE, msg + '\n'); } catch {}
  },
  error: (...args: any[]) => {
    const msg = 'ERROR: ' + args.join(' ');
    console.error(msg);
    try { fs.appendFileSync(LOG_FILE, msg + '\n'); } catch {}
  }
};

async function verifyDatabase() {
  log.info('Checking database connectivity...');
  
  // 1. Check Drizzle connection
  try {
    const result = await db.execute(sql`SELECT 1 as ping`);
    const val = (result as any).rows?.[0]?.ping || (result as any)?.[0]?.ping;
    if (val === 1) {
      log.info('✓ Drizzle ORM connected to PostgreSQL successfully.');
    } else {
      throw new Error('Drizzle returned unexpected ping response');
    }
  } catch (err: any) {
    log.error('✗ Drizzle ORM connection failed:', err.message);
  }

  // 2. Check Prisma connection
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ping`;
    if (Array.isArray(result) && result[0]?.ping === 1) {
      log.info('✓ Prisma Client connected to PostgreSQL successfully.');
    } else {
      throw new Error('Prisma returned unexpected query response');
    }
  } catch (err: any) {
    log.error('✗ Prisma Client connection failed:', err.message);
  }
}

async function verifyRedis() {
  log.info('Checking Redis connectivity...');
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    log.warn('! REDIS_URL not set. Background workers and Socket.io Pub/Sub require Redis.');
    return;
  }

  const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: () => null,
  });
  try {
    const pingResult = await redis.ping();
    if (pingResult === 'PONG') {
      log.info('✓ Redis connected successfully.');
    } else {
      throw new Error(`Unexpected Redis ping response: ${pingResult}`);
    }
  } catch (err: any) {
    log.error('✗ Redis connection failed:', err.message);
  } finally {
    redis.disconnect();
  }
}

async function verifyEvolutionAPI() {
  log.info('Checking Evolution API connection...');
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.AUTHENTICATION_API_KEY;

  if (!evolutionUrl) {
    log.error('✗ EVOLUTION_API_URL is missing in environment configuration.');
    return;
  }
  if (!apiKey) {
    log.warn('! AUTHENTICATION_API_KEY is missing. Evolution API requests will fail authentication.');
  }

  try {
    const cleanUrl = evolutionUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey || '' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      log.info(`✓ Evolution API is reachable. Detected ${data.length || 0} active instance(s).`);
    } else {
      log.error(`✗ Evolution API returned HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err: any) {
    log.error('✗ Evolution API is unreachable:', err.message);
  }
}

async function verifyAIProviders() {
  log.info('Checking AI provider configurations...');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    log.info('✓ OpenAI API key detected.');
  } else {
    log.warn('! OpenAI API key missing. OpenAI integration will require tenant-specific keys.');
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    log.info('✓ Google Gemini API key detected.');
  } else {
    log.warn('! Google Gemini API key missing.');
  }
}

async function verifyResend() {
  log.info('Checking Resend SMTP configuration...');
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    log.info('✓ Resend API Key detected.');
  } else {
    log.warn('! Resend API Key is missing. Email routing is disabled.');
  }
}

async function verifyRealtime() {
  log.info('Checking Realtime configurations...');
  const pusherAppId = process.env.PUSHER_APP_ID;
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherSecret = process.env.PUSHER_SECRET;

  if (pusherAppId && pusherKey && pusherSecret) {
    log.info('✓ Pusher configuration detected (Realtime active).');
  } else {
    log.info('! Pusher keys absent. System will transparently fall back to self-hosted Socket.io WebSockets.');
  }
}

async function run() {
  log.info('=== Starting WhatSaaS Integration Verification ===');
  await verifyDatabase();
  await verifyRedis();
  await verifyEvolutionAPI();
  await verifyAIProviders();
  await verifyResend();
  await verifyRealtime();
  log.info('=== Diagnostics complete ===');
  process.exit(0);
}

run().catch((err) => {
  log.error('Integration verification script crash:', err);
  process.exit(1);
});
