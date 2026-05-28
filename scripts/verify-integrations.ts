import 'dotenv/config';
import { db } from '../lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import { logger } from '../lib/logger';

async function verifyDatabase() {
  logger.info('Checking database connectivity...');
  
  // 1. Check Drizzle connection
  try {
    const result = await db.execute(sql`SELECT 1 as ping`);
    const val = (result as any).rows?.[0]?.ping || (result as any)?.[0]?.ping;
    if (val === 1) {
      logger.info('✓ Drizzle ORM connected to PostgreSQL successfully.');
    } else {
      throw new Error('Drizzle returned unexpected ping response');
    }
  } catch (err: any) {
    logger.error('✗ Drizzle ORM connection failed:', err.message);
  }

  // 2. Check Prisma connection
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ping`;
    if (Array.isArray(result) && result[0]?.ping === 1) {
      logger.info('✓ Prisma Client connected to PostgreSQL successfully.');
    } else {
      throw new Error('Prisma returned unexpected query response');
    }
  } catch (err: any) {
    logger.error('✗ Prisma Client connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyRedis() {
  logger.info('Checking Redis connectivity...');
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('! REDIS_URL not set. Background workers and Socket.io Pub/Sub require Redis.');
    return;
  }

  const redis = new IORedis(redisUrl, { maxRetriesPerRequest: 1 });
  try {
    const pingResult = await redis.ping();
    if (pingResult === 'PONG') {
      logger.info('✓ Redis connected successfully.');
    } else {
      throw new Error(`Unexpected Redis ping response: ${pingResult}`);
    }
  } catch (err: any) {
    logger.error('✗ Redis connection failed:', err.message);
  } finally {
    redis.disconnect();
  }
}

async function verifyEvolutionAPI() {
  logger.info('Checking Evolution API connection...');
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.AUTHENTICATION_API_KEY;

  if (!evolutionUrl) {
    logger.error('✗ EVOLUTION_API_URL is missing in environment configuration.');
    return;
  }
  if (!apiKey) {
    logger.warn('! AUTHENTICATION_API_KEY is missing. Evolution API requests will fail authentication.');
  }

  try {
    const cleanUrl = evolutionUrl.replace(/\/$/, '');
    const res = await fetch(`${cleanUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey || '' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      logger.info(`✓ Evolution API is reachable. Detected ${data.length || 0} active instance(s).`);
    } else {
      logger.error(`✗ Evolution API returned HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err: any) {
    logger.error('✗ Evolution API is unreachable:', err.message);
  }
}

async function verifyAIProviders() {
  logger.info('Checking AI provider configurations...');
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    logger.info('✓ OpenAI API key detected.');
  } else {
    logger.warn('! OpenAI API key missing. OpenAI integration will require tenant-specific keys.');
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    logger.info('✓ Google Gemini API key detected.');
  } else {
    logger.warn('! Google Gemini API key missing.');
  }
}

async function verifyResend() {
  logger.info('Checking Resend SMTP configuration...');
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    logger.info('✓ Resend API Key detected.');
  } else {
    logger.warn('! Resend API Key is missing. Email routing is disabled.');
  }
}

async function verifyRealtime() {
  logger.info('Checking Realtime configurations...');
  const pusherAppId = process.env.PUSHER_APP_ID;
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const pusherSecret = process.env.PUSHER_SECRET;

  if (pusherAppId && pusherKey && pusherSecret) {
    logger.info('✓ Pusher configuration detected (Realtime active).');
  } else {
    logger.info('! Pusher keys absent. System will transparently fall back to self-hosted Socket.io WebSockets.');
  }
}

async function run() {
  logger.info('=== Starting WhatSaaS Integration Verification ===');
  await verifyDatabase();
  await verifyRedis();
  await verifyEvolutionAPI();
  await verifyAIProviders();
  await verifyResend();
  await verifyRealtime();
  logger.info('=== Diagnostics complete ===');
}

run().catch((err) => {
  logger.error('Integration verification script crash:', err);
});
