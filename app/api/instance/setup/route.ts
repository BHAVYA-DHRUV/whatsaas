import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { logActivity } from '@/lib/db/activity';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { ActivityType, evolutionInstances } from '@/lib/db/schema';
import { enforceLimit } from '@/lib/limits';
import { getEvolutionConfig, isChannelActive } from '@/lib/whatsapp/config';

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

async function parseEvolutionJson(response: Response) {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

function extractEvolutionError(payload: any, fallback: string) {
  return payload?.response?.message?.[0] || payload?.message || payload?.error || fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
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
      rejectCalls,
      ignoreGroups,
      alwaysOnline,
      readMessages,
      readStatus,
    } = parsed.data;

    const evoConfig = await getEvolutionConfig();
    const EVOLUTION_API_URL = evoConfig.apiUrl;
    const MASTER_API_KEY = evoConfig.apiKey;
    const WEBHOOK_URL = evoConfig.webhookUrl;

    if (!EVOLUTION_API_URL) {
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

    try {
      await enforceLimit(team.id, 'instances');
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
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
        url: WEBHOOK_URL,
        byEvents: false,
        base64: true,
        events: WEBHOOK_EVENTS,
      },
      rejectCalls,
      ignoreGroups,
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

    let createResponse: Response;
    try {
      createResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: MASTER_API_KEY,
        },
        body: JSON.stringify(evolutionPayload),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (isEvolutionUnavailableError(error)) {
        return NextResponse.json(
          {
            success: false,
            error: `Evolution API is unavailable at ${EVOLUTION_API_URL}. Start the service, then try generating the QR code again.`,
          },
          { status: 503 }
        );
      }
      throw error;
    }

    let createData = await parseEvolutionJson(createResponse);

    if (!createResponse.ok) {
      const errorMsg = extractEvolutionError(createData, 'Failed to create instance.');
      const normalizedError = JSON.stringify(createData).toLowerCase();

      if (normalizedError.includes('already exists') || createResponse.status === 403) {
        const existingResponse = await fetch(
          `${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${evoInstanceName}`,
          {
            headers: { apikey: MASTER_API_KEY },
            cache: 'no-store',
            signal: AbortSignal.timeout(10_000),
          }
        );

        const existingData = await parseEvolutionJson(existingResponse);
        if (!existingResponse.ok) {
          return NextResponse.json(
            {
              success: false,
              error: extractEvolutionError(existingData, `Instance ${cleanDisplayName} already exists.`),
            },
            { status: existingResponse.status || 409 }
          );
        }

        const foundInstance = Array.isArray(existingData)
          ? existingData.find((item: any) => item.instance?.instanceName === evoInstanceName || item.instanceName === evoInstanceName)
          : existingData;

        if (!foundInstance) {
          return NextResponse.json(
            {
              success: false,
              error: `Instance ${cleanDisplayName} already exists, but its details could not be loaded.`,
            },
            { status: 409 }
          );
        }

        createData = foundInstance;
      } else {
        return NextResponse.json({ success: false, error: errorMsg }, { status: createResponse.status || 500 });
      }
    }

    const resolvedInstanceId =
      createData.instance?.instanceId ||
      createData.instance?.id ||
      createData.instanceId ||
      createData.id ||
      existingDbInstance?.evolutionInstanceId ||
      evoInstanceName;

    let qrData: any = null;
    let status = 'creating';

    if (integration === 'WHATSAPP-BAILEYS') {
      let connectResponse: Response;
      try {
        connectResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${evoInstanceName}`, {
          method: 'GET',
          headers: { apikey: MASTER_API_KEY },
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
      } catch (error) {
        if (isEvolutionUnavailableError(error)) {
          return NextResponse.json(
            {
              success: false,
              error: `Evolution API is unavailable at ${EVOLUTION_API_URL}. Start the service, then try generating the QR code again.`,
            },
            { status: 503 }
          );
        }
        throw error;
      }

      const connectData = await parseEvolutionJson(connectResponse);

      if (!connectResponse.ok) {
        const qrError = extractEvolutionError(connectData, 'Failed to fetch QR Code.');
        const normalizedError = qrError.toLowerCase();

        if (
          normalizedError.includes('already connected') ||
          normalizedError.includes('already open') ||
          normalizedError.includes('logged')
        ) {
          status = 'open';
        } else {
          return NextResponse.json({ success: false, error: qrError }, { status: connectResponse.status || 500 });
        }
      } else {
        qrData = connectData;
        status = qrData?.base64 || qrData?.qrcode?.base64 ? 'waiting_qr' : 'connecting';
      }
    }

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
          updatedAt: new Date(),
        },
      });

    await logActivity(team.id, user.id, ActivityType.CREATE_INSTANCE);

    return NextResponse.json({
      success: true,
      instance: {
        ...createData.instance,
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
