/**
 * Seeds enterprise SaaS plans (FREE / STARTER / BUSINESS / ENTERPRISE) and default branding.
 * Run: pnpm db:seed:plans  (or via pnpm db:bootstrap)
 */
import 'dotenv/config';
import { db } from './drizzle';
import { branding, plans } from './schema';
import { eq } from 'drizzle-orm';

const PLAN_ROWS = [
  {
    name: 'FREE',
    description: 'Unlimited users, contacts, WhatsApp connections, and all features',
    amount: 0,
    maxUsers: -1,
    maxContacts: -1,
    maxInstances: -1,
    isAiEnabled: true,
    isFlowBuilderEnabled: true,
    isCampaignsEnabled: true,
    isTemplatesEnabled: true,
    isVoiceCallsEnabled: true,
    trialDays: 0,
  },
  {
    name: 'STARTER',
    description: 'Small teams — automation & templates',
    amount: 2900,
    maxUsers: 2,
    maxContacts: 2000,
    maxInstances: 1,
    isAiEnabled: false,
    isFlowBuilderEnabled: true,
    isCampaignsEnabled: false,
    isTemplatesEnabled: true,
    isVoiceCallsEnabled: false,
    trialDays: 14,
  },
  {
    name: 'BUSINESS',
    description: 'Growing teams — AI, campaigns, voice',
    amount: 9900,
    maxUsers: 10,
    maxContacts: 25000,
    maxInstances: 3,
    isAiEnabled: true,
    isFlowBuilderEnabled: true,
    isCampaignsEnabled: true,
    isTemplatesEnabled: true,
    isVoiceCallsEnabled: true,
    trialDays: 14,
  },
  {
    name: 'ENTERPRISE',
    description: 'Unlimited scale, API, priority support',
    amount: 29900,
    maxUsers: 999,
    maxContacts: 999999,
    maxInstances: 999,
    isAiEnabled: true,
    isFlowBuilderEnabled: true,
    isCampaignsEnabled: true,
    isTemplatesEnabled: true,
    isVoiceCallsEnabled: true,
    trialDays: 30,
  },
] as const;

async function seedPlans() {
  for (const p of PLAN_ROWS) {
    const existing = await db.query.plans.findFirst({ where: eq(plans.name, p.name) });
    if (existing) {
      console.log(`Plan exists: ${p.name}`);
      continue;
    }
    await db.insert(plans).values({
      name: p.name,
      description: p.description,
      amount: p.amount,
      currency: 'usd',
      interval: 'month',
      trialDays: p.trialDays,
      maxUsers: p.maxUsers,
      maxContacts: p.maxContacts,
      maxInstances: p.maxInstances,
      isAiEnabled: p.isAiEnabled,
      isFlowBuilderEnabled: p.isFlowBuilderEnabled,
      isCampaignsEnabled: p.isCampaignsEnabled,
      isTemplatesEnabled: p.isTemplatesEnabled,
      isVoiceCallsEnabled: p.isVoiceCallsEnabled,
    });
    console.log(`Created plan: ${p.name}`);
  }

  for (const p of PLAN_ROWS) {
    const yearlyName = `${p.name} (Yearly)`;
    const existing = await db.query.plans.findFirst({ where: eq(plans.name, yearlyName) });
    if (existing) continue;
    await db.insert(plans).values({
      name: yearlyName,
      description: p.description,
      amount: Math.round(p.amount * 10),
      currency: 'usd',
      interval: 'year',
      trialDays: p.trialDays,
      maxUsers: p.maxUsers,
      maxContacts: p.maxContacts,
      maxInstances: p.maxInstances,
      isAiEnabled: p.isAiEnabled,
      isFlowBuilderEnabled: p.isFlowBuilderEnabled,
      isCampaignsEnabled: p.isCampaignsEnabled,
      isTemplatesEnabled: p.isTemplatesEnabled,
      isVoiceCallsEnabled: p.isVoiceCallsEnabled,
    });
    console.log(`Created plan: ${yearlyName}`);
  }
}

async function seedBranding() {
  const row = await db.query.branding.findFirst();
  if (row) {
    console.log('Branding already exists.');
    return;
  }
  await db.insert(branding).values({
    name: 'WhatSaaS',
    logoUrl: null,
    faviconUrl: null,
  });
  console.log('Default branding created.');
}

async function main() {
  await seedPlans();
  await seedBranding();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
