import 'server-only';

import { db } from '@/lib/db/drizzle';
import {
  callCredits,
  callCreditTransactions,
  callLogs,
  teamPhoneNumbers,
  twilioConfigs,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTwilioClient } from './twilio-client';

export async function getCreditsBalance(teamId: number): Promise<number> {
  const row = await db.query.callCredits.findFirst({
    where: eq(callCredits.teamId, teamId),
  });
  return row?.balance ?? 0;
}

export async function addCredits(
  teamId: number,
  amount: number,
  stripePaymentIntentId?: string,
  description?: string
) {
  if (amount <= 0) return;

  const existing = await db.query.callCredits.findFirst({
    where: eq(callCredits.teamId, teamId),
  });

  if (existing) {
    await db
      .update(callCredits)
      .set({ balance: existing.balance + amount, updatedAt: new Date() })
      .where(eq(callCredits.teamId, teamId));
  } else {
    await db.insert(callCredits).values({ teamId, balance: amount });
  }

  await db.insert(callCreditTransactions).values({
    teamId,
    type: 'credit',
    amount,
    description: description || 'Credit purchase',
    stripePaymentIntentId: stripePaymentIntentId ?? null,
  });
}

export async function generateClientToken({
  teamId,
  userId,
}: {
  teamId: number;
  userId: number;
}) {
  const config = await db.query.twilioConfigs.findFirst({
    where: eq(twilioConfigs.isActive, true),
  });

  if (!config?.apiKeySid || !config.apiKeySecret) {
    throw new Error('No active Twilio configuration');
  }

  const identity = `team-${teamId}-user-${userId}`;
  const AccessToken = (await import('twilio')).jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(config.accountSid, config.apiKeySid, config.apiKeySecret, {
    identity,
    ttl: 3600,
  });

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: config.twimlAppSid || undefined,
    incomingAllow: true,
  });
  token.addGrant(voiceGrant);

  return { token: token.toJwt(), identity };
}

export async function provisionPhoneNumber(
  teamId: number,
  phoneNumber: string,
  stripeSubscriptionId: string | null
) {
  const config = await db.query.twilioConfigs.findFirst({
    where: eq(twilioConfigs.isActive, true),
  });

  if (!config) throw new Error('Twilio not configured');

  const client = createTwilioClient(config);
  const purchased = await client.incomingPhoneNumbers.create({ phoneNumber });

  await db.insert(teamPhoneNumbers).values({
    teamId,
    phoneNumber,
    twilioPhoneSid: purchased.sid,
    stripeSubscriptionId: stripeSubscriptionId ?? undefined,
    isActive: true,
  });
}

export async function handleCallStatusUpdate(
  callSid: string,
  callStatus: string,
  callDuration?: number,
  recordingUrl?: string,
  recordingSid?: string
) {
  const log = await db.query.callLogs.findFirst({
    where: eq(callLogs.twilioCallSid, callSid),
  });

  if (!log) return;

  const updates: Partial<typeof callLogs.$inferInsert> = {
    status: callStatus,
    recordingUrl: recordingUrl ?? log.recordingUrl,
    recordingSid: recordingSid ?? log.recordingSid,
  };

  if (callStatus === 'completed' && callDuration != null) {
    updates.duration = callDuration;
    updates.endedAt = new Date();
    const minutes = Math.max(1, Math.ceil(callDuration / 60));
    const credits = await db.query.callCredits.findFirst({
      where: eq(callCredits.teamId, log.teamId),
    });
    if (credits && credits.balance >= minutes) {
      await db
        .update(callCredits)
        .set({ balance: credits.balance - minutes, updatedAt: new Date() })
        .where(eq(callCredits.teamId, log.teamId));
      await db.insert(callCreditTransactions).values({
        teamId: log.teamId,
        type: 'debit',
        amount: minutes,
        description: `Call ${callSid}`,
        callLogId: log.id,
      });
      updates.creditsUsed = minutes;
    }
  }

  await db.update(callLogs).set(updates).where(eq(callLogs.id, log.id));
}
