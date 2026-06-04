import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { logActivity } from '@/lib/db/activity';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { ActivityType, evolutionInstances } from '@/lib/db/schema';
import { getEvolutionConfig, isChannelActive } from '@/lib/whatsapp/config';
import { EvolutionSDK } from '@/lib/whatsapp/evolution-sdk';

const WEBHOOK_EVENTS = [
  'MESSAGES_UPSERT',
  'MESSAGES_UPDATE',
  'CHATS_UPDATE',
  'CONNECTION_UPDATE',
  'QRCODE_UPDATED',
  'CONTACTS_UPDATE',
];

const setupInstanceSchema = z.object({
  instanceName: z.string().trim().min(1).max(50).optional().default('Main'),
  number: z.string().trim().optional().nullable(),
  integration: z.enum(['WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS']).default('WHATSAPP-BAILEYS'),
  metaToken: z.string().trim().optional().nullable(),
  metaBusinessId: z.string().trim().optional().nullable(),
  metaPhoneNumberId: z.string().trim().optional().nullable(),
  rejectCalls: z.boolean().optional().default(false),
  ignoreGroups: z.boolean().optional().default(true),
  alwaysOnline: z.boolean().optional().default(true),
  readMessages: z.boolean().optional().default(false),
  readStatus: z.boolean().optional().default(false),
});

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

export async function POST(request: Request) {
  console.log('[QR DEBUG] Instance setup request received');
  try {
    const body = await request.json().catch(() => null);
    console.log('[QR DEBUG] Request body:', JSON.stringify(body, null, 2));
    const parsed = setupInstanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid instance setup payload.',
        },
        { status: 400 }
      );
    }

    const {
      instanceName,
      number,
      integration,
      metaToken,
      metaBusinessId,
      metaPhoneNumberId,
    } = parsed.data;

    const rejectCall = Boolean((parsed.data as any).rejectCall ?? (parsed.data as any).rejectCalls ?? false);
    const groupsIgnore = Boolean((parsed.data as any).groupsIgnore ?? (parsed.data as any).ignoreGroups ?? true);
    const alwaysOnline = Boolean((parsed.data as any).alwaysOnline ?? true);
    const readMessages = Boolean((parsed.data as any).readMessages ?? false);
    const readStatus = Boolean((parsed.data as any).readStatus ?? false);

    const evoConfig = await getEvolutionConfig();
    console.log('[QR DEBUG] Evolution config:', JSON.stringify({
      apiUrl: evoConfig.apiUrl,
      hasApiKey: !!evoConfig.apiKey,
      webhookUrl: evoConfig.webhookUrl,
      isActive: evoConfig.isActive
    }, null, 2));
    const MASTER_API_KEY = evoConfig.apiKey;
    const WEBHOOK_URL = evoConfig.webhookUrl;

    if (!evoConfig.apiUrl) {
      return NextResponse.json({ success: false, error: 'Evolution API URL is not configured on the server.' }, { status: 500 });
    }
    if (!MASTER_API_KEY) {
      return NextResponse.json({ success: false, error: 'Evolution API key is not configured on the server.' }, { status: 500 });
    }
    if (!WEBHOOK_URL) {
      return NextResponse.json({ success: false, error: 'Evolution webhook URL is not configured on the server.' }, { status: 500 });
    }

    const user = await getUser();
    const team = await getTeamForUser();

    if (!user || !team) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isChannelActive('evolution'))) {
      return NextResponse.json({ success: false, error: 'This channel is disabled by the administrator.' }, { status: 403 });
    }

    if (
      integration === 'WHATSAPP-BUSINESS' &&
      (!metaToken || !metaBusinessId || !metaPhoneNumberId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business integration requires system user token, business ID, and phone number ID.',
        },
        { status: 400 }
      );
    }

    const cleanDisplayName = String(instanceName || 'Main')
      .trim()
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .slice(0, 50) || 'Main';
    const stableSlug = cleanDisplayName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '') || 'main';
    const evoInstanceName = `team-${team.id}-${stableSlug}`;

    const existingDbInstance = await db.query.evolutionInstances.findFirst({
      where: and(
        eq(evolutionInstances.teamId, team.id),
        eq(evolutionInstances.instanceName, evoInstanceName)
      ),
      columns: {
        id: true,
        evolutionInstanceId: true,
      },
    });

    const evolutionPayload: Record<string, unknown> = {
      instanceName: evoInstanceName,
      integration,
      qrcode: integration === 'WHATSAPP-BAILEYS',
      webhook: {
        enabled: true,
        url: WEBHOOK_URL,
        headers: {
          apikey: evoConfig.webhookToken || '',
        },
        byEvents: false,
        base64: true,
        events: WEBHOOK_EVENTS,
      },
      rejectCall,
      groupsIgnore,
      alwaysOnline,
      readMessages,
      readStatus,
    };

    if (integration === 'WHATSAPP-BUSINESS') {
      evolutionPayload.token = metaToken;
      evolutionPayload.number = metaPhoneNumberId;
      evolutionPayload.businessId = metaBusinessId;
    } else if (number) {
      evolutionPayload.number = number;
    }

    let createData: any;
    try {
      console.log('[INSTANCE SETUP LOG] Requesting Evolution API to create instance:', evoInstanceName);
      console.log('[INSTANCE SETUP LOG] Evolution payload:', JSON.stringify(evolutionPayload, null, 2));
      createData = await EvolutionSDK.createInstance(evoInstanceName, evolutionPayload);
      console.log('[INSTANCE SETUP LOG] Evolution API create instance response:', JSON.stringify(createData, null, 2));
      console.log('[INSTANCE SETUP LOG] Webhook registration request completed during creation payload.');
    } catch (error: any) {
      if (isEvolutionUnavailableError(error)) {
        console.error('[INSTANCE SETUP LOG] Evolution API is unavailable:', error.message);
        return NextResponse.json(
          {
            success: false,
            error: `Evolution API is unavailable. Start the service, then try generating the QR code again.`,
          },
          { status: 503 }
        );
      }

      const normalizedError = error.message.toLowerCase();
      if (normalizedError.includes('already exists') || normalizedError.includes('403') || normalizedError.includes('409')) {
        try {
          console.log(`[INSTANCE SETUP LOG] Instance ${evoInstanceName} already exists in Evolution API. Explicitly registering webhook...`);
          await EvolutionSDK.setWebhook(evoInstanceName, {
            enabled: true,
            url: WEBHOOK_URL,
            events: WEBHOOK_EVENTS,
          });
          console.log(`[INSTANCE SETUP LOG] Webhook registered successfully for existing instance ${evoInstanceName}.`);
          createData = await EvolutionSDK.getConnectionState(evoInstanceName);
          console.log('[INSTANCE SETUP LOG] Loaded connection state for pre-existing instance:', JSON.stringify(createData, null, 2));
        } catch (conflictError: any) {
          console.error(`[INSTANCE SETUP LOG] Failed to handle pre-existing instance ${evoInstanceName}:`, conflictError.message);
          return NextResponse.json(
            {
              success: false,
              error: `Instance ${cleanDisplayName} already exists, but its details or webhook could not be set.`,
            },
            { status: 409 }
          );
        }
      } else {
        console.error('[INSTANCE SETUP LOG] Unhandled Evolution API creation error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    const resolvedInstanceId =
      createData?.instance?.instanceId ||
      createData?.instance?.id ||
      createData?.instanceId ||
      createData?.id ||
      existingDbInstance?.evolutionInstanceId ||
      evoInstanceName;

    let qrData: any = null;
    let status = 'creating';

    if (integration === 'WHATSAPP-BAILEYS') {
      try {
        console.log('[QR DEBUG] Fetching QR code for instance:', evoInstanceName);
        qrData = await EvolutionSDK.fetchQR(evoInstanceName);
        console.log('[QR DEBUG] QR fetch response:', JSON.stringify({
          hasBase64: !!qrData?.base64 || !!qrData?.qrcode?.base64,
          hasCode: !!qrData?.code || !!qrData?.qrcode?.code,
          hasPairingCode: !!qrData?.pairingCode || !!qrData?.qrcode?.pairingCode,
          base64Length: qrData?.base64?.length || qrData?.qrcode?.base64?.length || 0,
          fullResponse: qrData
        }, null, 2));
        status = qrData?.base64 || qrData?.qrcode?.base64 ? 'waiting_qr' : 'connecting';
      } catch (error: any) {
        if (isEvolutionUnavailableError(error)) {
          return NextResponse.json(
            {
              success: false,
              error: `Evolution API is unavailable. Start the service, then try generating the QR code again.`,
            },
            { status: 503 }
          );
        }

        const qrError = error.message;
        const normalizedError = qrError.toLowerCase();

        if (
          normalizedError.includes('already connected') ||
          normalizedError.includes('already open') ||
          normalizedError.includes('logged')
        ) {
          status = 'open';
        } else {
          // Instance is still initializing — treat as 'connecting', frontend will poll
          console.warn(`[setup] QR fetch failed (instance still initializing): ${qrError}`);
          status = 'connecting';
        }
      }
    }

    console.log('[INSTANCE SETUP LOG] Database insert/upsert running for instance:', evoInstanceName, 'status:', status);
    await db.insert(evolutionInstances)
      .values({
        teamId: team.id,
        instanceName: evoInstanceName,
        displayName: cleanDisplayName,
        instanceNumber: integration === 'WHATSAPP-BUSINESS' ? metaPhoneNumberId || null : number || null,
        evolutionInstanceId: String(resolvedInstanceId),
        accessToken: MASTER_API_KEY,
        integration,
        metaBusinessId: metaBusinessId || null,
        metaPhoneNumberId: metaPhoneNumberId || null,
        metaToken: metaToken || null,
        status,
        createdBy: user.id,
      })
      .onConflictDoUpdate({
        target: [evolutionInstances.teamId, evolutionInstances.instanceName],
        set: {
          displayName: cleanDisplayName,
          instanceNumber: integration === 'WHATSAPP-BUSINESS' ? metaPhoneNumberId || null : number || null,
          evolutionInstanceId: String(resolvedInstanceId),
          accessToken: MASTER_API_KEY,
          integration,
          metaBusinessId: metaBusinessId || null,
          metaPhoneNumberId: metaPhoneNumberId || null,
          metaToken: metaToken || null,
          status,
          createdBy: user.id,
          updatedAt: new Date(),
        },
      });

    console.log(`[INSTANCE_CREATED] Created instance: ${evoInstanceName}`);
    console.log('[INSTANCE SETUP LOG] Database insert/upsert completed for instance:', evoInstanceName);

    // Verify instance exists in Evolution API before returning success (non-blocking warning check)
    try {
      console.log(`[INSTANCE SETUP LOG] Verifying instance ${evoInstanceName} exists in Evolution API...`);
      const verifyResult = await EvolutionSDK.fetchInstances(evoInstanceName);
      console.log(`[INSTANCE SETUP LOG] Verification response:`, JSON.stringify(verifyResult, null, 2));
    } catch (verifyError: any) {
      console.warn(`[INSTANCE SETUP LOG] Verification check failed (instance might still be initializing asynchronously):`, verifyError.message);
    }

    await logActivity(team.id, user.id, ActivityType.CREATE_INSTANCE);

    console.log('[INSTANCE SETUP LOG] Instance setup completed successfully');
    console.log('[INSTANCE SETUP LOG] Response payload to client:', JSON.stringify({
      success: true,
      instance: {
        instanceName: evoInstanceName,
        displayName: cleanDisplayName,
        instanceId: resolvedInstanceId,
        status,
      },
      hasQrCode: !!qrData?.base64 || !!qrData?.qrcode?.base64
    }, null, 2));

    return NextResponse.json({
      success: true,
      instance: {
        instanceName: evoInstanceName,
        displayName: cleanDisplayName,
        instanceId: resolvedInstanceId,
        status,
      },
      internalName: evoInstanceName,
      hash: MASTER_API_KEY,
      type: integration,
      qrcode: qrData
        ? {
            pairingCode: qrData.pairingCode || qrData.qrcode?.pairingCode || null,
            code: qrData.code || qrData.qrcode?.code || null,
            base64: qrData.base64 || qrData.qrcode?.base64 || null,
            count: qrData.count || qrData.qrcode?.count || null,
          }
        : null,
    });
  } catch (error: any) {
    if (isEvolutionUnavailableError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: `Evolution API is unavailable at ${process.env.EVOLUTION_API_URL || 'http://localhost:8080'}. Start the service, then try again.`,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
