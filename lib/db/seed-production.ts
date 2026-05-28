/**
 * Production seed: subscription plans, 3 demo tenants, CRM stages, automations, AI configs.
 * Run: pnpm db:seed:production
 */
import { db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  plans,
  funnelStages,
  automations,
  aiConfigs,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { and, eq } from 'drizzle-orm';
import {
  CRM_FUNNEL_STAGES,
  DEFAULT_AI_PROMPT,
  getDefaultAutomations,
} from './seed-templates/default-automations';

const TENANTS = [
  {
    slug: 'tenant-1',
    teamName: 'Tenant 1 Workspace',
    email: 'admin1@tenant.com',
    password: 'Tenant1Admin!2026',
    planKey: 'starter' as const,
    timezone: 'Asia/Kolkata',
  },
  {
    slug: 'tenant-2',
    teamName: 'Tenant 2 Workspace',
    email: 'admin2@tenant.com',
    password: 'Tenant2Admin!2026',
    planKey: 'business' as const,
    timezone: 'America/New_York',
  },
  {
    slug: 'tenant-3',
    teamName: 'Tenant 3 Workspace',
    email: 'admin3@tenant.com',
    password: 'Tenant3Admin!2026',
    planKey: 'enterprise' as const,
    timezone: 'Europe/London',
  },
];

const PLAN_DEFS = [
  {
    key: 'starter',
    name: 'Starter',
    description: '2 users, 1 WhatsApp, basic automation',
    maxUsers: 2,
    maxContacts: 2000,
    maxInstances: 1,
    isAiEnabled: false,
    isFlowBuilderEnabled: true,
    isCampaignsEnabled: false,
    isTemplatesEnabled: true,
    isVoiceCallsEnabled: false,
    amount: 2900,
  },
  {
    key: 'business',
    name: 'Business',
    description: '5 users, 3 WhatsApp, advanced automation',
    maxUsers: 5,
    maxContacts: 10000,
    maxInstances: 3,
    isAiEnabled: true,
    isFlowBuilderEnabled: true,
    isCampaignsEnabled: true,
    isTemplatesEnabled: true,
    isVoiceCallsEnabled: true,
    amount: 9900,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited users & WhatsApp, AI + API access',
    maxUsers: 999,
    maxContacts: 999999,
    maxInstances: 999,
    isAiEnabled: true,
    isFlowBuilderEnabled: true,
    isCampaignsEnabled: true,
    isTemplatesEnabled: true,
    isVoiceCallsEnabled: true,
    amount: 29900,
  },
];

async function upsertPlans() {
  const map = new Map<string, number>();
  for (const p of PLAN_DEFS) {
    const existing = await db.query.plans.findFirst({ where: eq(plans.name, p.name) });
    if (existing) {
      map.set(p.key, existing.id);
      continue;
    }
    const [row] = await db
      .insert(plans)
      .values({
        name: p.name,
        description: p.description,
        maxUsers: p.maxUsers,
        maxContacts: p.maxContacts,
        maxInstances: p.maxInstances,
        isAiEnabled: p.isAiEnabled,
        isFlowBuilderEnabled: p.isFlowBuilderEnabled,
        isCampaignsEnabled: p.isCampaignsEnabled,
        isTemplatesEnabled: p.isTemplatesEnabled,
        isVoiceCallsEnabled: p.isVoiceCallsEnabled,
        amount: p.amount,
        currency: 'usd',
        interval: 'month',
        trialDays: 14,
      })
      .returning();
    map.set(p.key, row.id);
  }
  return map;
}

async function seed() {
  console.log('=== WhatSaaS production seed ===\n');

  const planIds = await upsertPlans();

  // Platform super admin (global)
  const superEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@platform.local';
  const superPass = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin!2026';
  const existingSuper = await db.query.users.findFirst({ where: eq(users.email, superEmail) });
  if (!existingSuper) {
    await db.insert(users).values({
      email: superEmail,
      name: 'Platform Super Admin',
      passwordHash: await hashPassword(superPass),
      role: 'admin',
    });
    console.log(`Super Admin: ${superEmail} / ${superPass}`);
  }

  for (const t of TENANTS) {
    const planId = planIds.get(t.planKey)!;

    let user = await db.query.users.findFirst({ where: eq(users.email, t.email) });
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: t.email,
          name: `${t.teamName} Admin`,
          passwordHash: await hashPassword(t.password),
          role: 'member',
        })
        .returning();
    }

    let team = await db.query.teams.findFirst({ where: eq(teams.name, t.teamName) });
    if (!team) {
      [team] = await db
        .insert(teams)
        .values({
          name: t.teamName,
          planId,
          planName: PLAN_DEFS.find((p) => p.key === t.planKey)!.name,
          subscriptionStatus: 'active',
          gatewayType: 'offline',
        })
        .returning();
    } else {
      await db
        .update(teams)
        .set({ planId, planName: PLAN_DEFS.find((p) => p.key === t.planKey)!.name, subscriptionStatus: 'active' })
        .where(eq(teams.id, team.id));
    }

    const membership = await db.query.teamMembers.findFirst({
      where: and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, user.id)),
    });
    if (!membership) {
      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: user.id,
        role: 'owner',
      });
    }

    const stageCount = await db.query.funnelStages.findMany({
      where: eq(funnelStages.teamId, team.id),
    });
    if (stageCount.length === 0) {
      for (const stage of CRM_FUNNEL_STAGES) {
        await db.insert(funnelStages).values({ teamId: team.id, ...stage });
      }
    }

    const autoCount = await db.query.automations.findMany({
      where: eq(automations.teamId, team.id),
    });
    if (autoCount.length === 0) {
      for (const flow of getDefaultAutomations()) {
        await db.insert(automations).values({
          teamId: team.id,
          name: flow.name,
          triggerKeyword: flow.triggerKeyword,
          nodes: flow.nodes,
          edges: flow.edges,
          isActive: flow.isActive,
        });
      }
    }

    const ai = await db.query.aiConfigs.findFirst({ where: eq(aiConfigs.teamId, team.id) });
    if (!ai) {
      await db.insert(aiConfigs).values({
        teamId: team.id,
        isActive: false,
        provider: 'openai',
        model: process.env.DEFAULT_AI_MODEL || 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY || 'REPLACE_ME',
        systemPrompt: DEFAULT_AI_PROMPT,
        maxOutputTokens: 800,
        temperature: '0.7',
      });
    }

    console.log(`Tenant: ${t.slug}`);
    console.log(`  Team ID: ${team.id} — ${t.teamName}`);
    console.log(`  Admin:   ${t.email} / ${t.password}`);
    console.log(`  Plan:    ${t.planKey} | Timezone (configure in UI): ${t.timezone}`);
    console.log(`  Evolution instance name (create in UI): ${t.slug}-wa\n`);
  }

  console.log('Production seed complete.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
