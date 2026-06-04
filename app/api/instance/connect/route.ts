import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries'; 
import { db } from '@/lib/db/drizzle'; 
import { evolutionInstances } from '@/lib/db/schema'; 
import { eq, and } from 'drizzle-orm';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { EvolutionSDK } from '@/lib/whatsapp/evolution-sdk';
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from '@/lib/cache/redis-cache';
import { QRManager } from '@/lib/whatsapp/qr-manager';
import { pusherServer } from '@/lib/pusher-server';

function isEvolutionUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ETIMEDOUT|timed out|Unable to connect/i.test(message);
}

function isAlreadyConnectedError(error: unknown) {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('already connected') ||
    message.includes('already open') ||
    message.includes('logged in') ||
    message.includes('instance already') ||
    message.includes('"open"') 
  );
}

async function normalizeQrResponse(data: any): Promise<string | null> {
  if (!data) return null;

  console.log('[QR CONVERSION LOG] Starting normalization on data:', JSON.stringify({
    hasBase64: !!data?.base64 || !!data?.qrcode?.base64,
    hasCode: !!data?.code || !!data?.qrcode?.code,
    hasQr: !!data?.qr || !!data?.qrcode?.qr,
    hasQrcode: !!data?.qrcode
  }));

  let qrCandidate = data.base64 ||
                    data.qrcode?.base64 ||
                    data.qr ||
                    data.qrcode?.qr ||
                    data.qrcode ||
                    data.code ||
                    data.qrcode?.code ||
                    null;

  if (typeof qrCandidate === 'object' && qrCandidate !== null) {
    qrCandidate = qrCandidate.base64 || qrCandidate.qrcode || qrCandidate.qr || qrCandidate.code || null;
  }

  if (typeof qrCandidate !== 'string') {
    return null;
  }

  const trimmed = qrCandidate.trim();

  if (trimmed.startsWith('data:')) {
    console.log('[QR CONVERSION LOG] Detected data URI scheme.');
    return trimmed;
  }

  if (/^[a-zA-Z0-9+/=]+$/.test(trimmed.replace(/\s/g, ''))) {
    console.log('[QR CONVERSION LOG] Detected raw base64. Normalizing...');
    return `data:image/png;base64,${trimmed}`;
  }

  console.log('[QR CONVERSION LOG] Detected raw QR code text. Requesting base64 image from qrserver API...');
  try {
    const res = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trimmed)}`);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const base64Str = buffer.toString('base64');
      console.log('[QR CONVERSION LOG] Base64 image generated successfully from text QR.');
      return `data:image/png;base64,${base64Str}`;
    }
  } catch (err: any) {
    console.error('[QR CONVERSION LOG] Failed to generate QR base64 from text via qrserver:', err.message);
  }

  return null;
}

export async function GET(request: NextRequest) {
  console.log('[QR REQUEST LOG] Connect endpoint called');
  try {
    const evoConfig = await getEvolutionConfig();
    console.log('[QR REQUEST LOG] Evolution config in connect:', JSON.stringify({
      apiUrl: evoConfig.apiUrl,
      hasApiKey: !!evoConfig.apiKey,
      webhookUrl: evoConfig.webhookUrl,
      isActive: evoConfig.isActive
    }, null, 2));

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const instanceName = request.nextUrl.searchParams.get('instanceName');
    console.log('[QR REQUEST LOG] Instance name from query:', instanceName);
    if (!instanceName) {
      return NextResponse.json({ error: 'Instance name is required' }, { status: 400 });
    }

    // 1. Verify instance exists in database
    const dbInstance = await db.query.evolutionInstances.findFirst({
      where: and(
        eq(evolutionInstances.teamId, team.id),
        eq(evolutionInstances.instanceName, instanceName)
      ),
    });
    console.log('[QR REQUEST LOG] Database instance found:', !!dbInstance);

    if (!dbInstance) {
      return NextResponse.json({ error: 'Instance not found or unauthorized' }, { status: 404 });
    }

    // 2. Verify Evolution API is reachable
    try {
      console.log('[QR REQUEST LOG] Checking reachability of Evolution API...');
      const healthResponse = await fetch(`${evoConfig.apiUrl.replace(/\/$/, '')}/instance/fetchInstances`, {
        headers: { 'apikey': evoConfig.apiKey || '' },
        signal: AbortSignal.timeout(4000)
      });
      if (!healthResponse.ok) {
        console.warn(`[QR REQUEST LOG] Evolution API reachability check failed with status: ${healthResponse.status}`);
      }
    } catch (reachError: any) {
      console.error('[QR REQUEST LOG] Evolution API is unreachable:', reachError.message);
      return NextResponse.json(
        { error: 'Evolution API is unreachable. Please verify the service is running.' },
        { status: 503 }
      );
    }

    const reconnect = request.nextUrl.searchParams.get('reconnect') === 'true';

    if (reconnect) {
      console.log(`[QR REQUEST LOG] Reconnect requested for instance ${instanceName}. Cleaning up session...`);
      
      // 1. Invalidate cached QR
      await QRManager.invalidateQR(instanceName);

      // 2. Try to logout and delete remote session gracefully
      try {
        if (evoConfig.apiKey) {
          console.log(`[INSTANCE_LOGOUT] Logging out existing session for reconnect: ${instanceName}`);
          await fetch(`${evoConfig.apiUrl}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': evoConfig.apiKey },
            signal: AbortSignal.timeout(5000),
          }).catch(() => null);

          console.log(`[INSTANCE_DELETED] Deleting existing session/websocket for reconnect: ${instanceName}`);
          await fetch(`${evoConfig.apiUrl}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': evoConfig.apiKey },
            signal: AbortSignal.timeout(5000),
          }).catch(() => null);
        }
      } catch (err) {
        console.warn('[QR REQUEST LOG] Remote session cleanup warning during reconnect:', err);
      }

      // 3. Recreate fresh session in Evolution API
      try {
        const WEBHOOK_URL = evoConfig.webhookUrl;
        const WEBHOOK_EVENTS = [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CHATS_UPDATE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'CONTACTS_UPDATE',
        ];

        const evolutionPayload: Record<string, unknown> = {
          instanceName: dbInstance.instanceName,
          integration: dbInstance.integration,
          qrcode: dbInstance.integration === 'WHATSAPP-BAILEYS',
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
          rejectCall: false,
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: false,
          readStatus: false,
        };

        if (dbInstance.integration === 'WHATSAPP-BUSINESS') {
          evolutionPayload.token = dbInstance.metaToken;
          evolutionPayload.number = dbInstance.metaPhoneNumberId;
          evolutionPayload.businessId = dbInstance.metaBusinessId;
        } else if (dbInstance.instanceNumber) {
          evolutionPayload.number = dbInstance.instanceNumber;
        }

        console.log(`[INSTANCE_CREATED] Creating fresh session for reconnect: ${instanceName}`);
        const createData = await EvolutionSDK.createInstance(instanceName, evolutionPayload);
        const resolvedInstanceId =
          createData?.instance?.instanceId ||
          createData?.instance?.id ||
          createData?.instanceId ||
          createData?.id ||
          dbInstance.evolutionInstanceId ||
          dbInstance.instanceName;

        await QRManager.persistStatus(dbInstance.id, 'connecting', {
          evolutionInstanceId: String(resolvedInstanceId)
        });

        // 4. Broadcast connection status change via Pusher
        const pusherChannel = `team-${team.id}`;
        await pusherServer.trigger(pusherChannel, 'connection-status', {
          status: 'connecting',
          instance: instanceName
        });

        // If creation returned QR immediately, return it!
        if (createData?.qrcode?.base64) {
          const normalized = await normalizeQrResponse(createData);
          const payload = {
            success: true,
            qrCode: normalized,
            base64: normalized,
            qrcode: normalized,
            code: createData.qrcode.code || null,
            pairingCode: createData.qrcode.pairingCode || null,
            status: 'waiting_qr',
          };
          await QRManager.setQR(instanceName, payload);
          console.log(`[QR_GENERATED] Generated new QR for ${instanceName} during setup`);
          return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
        }
      } catch (createErr: any) {
        console.error(`[QR REQUEST LOG] Reconnect session recreation failed for ${instanceName}:`, createErr.message);
      }
    } else {
      // If already connected (and not reconnecting), return open
      if (dbInstance.status === 'open') {
        console.log('[QR RETURN LOG] Instance already connected (from DB status). Returning open status.');
        return NextResponse.json({ success: true, base64: null, qrCode: null, code: null, pairingCode: null, status: 'open' });
      }
    }

    const requestLockKey = `lock:qr_request:${instanceName}`;

    // Check Redis request lock first to avoid resetting Baileys connection socket (405)
    const hasLock = await cacheGet<boolean>(requestLockKey);
    if (hasLock) {
      console.log(`[QR RETURN LOG] Request lock active for ${instanceName}. Skipping Evolution API fetchQR to allow bootstrap.`);
      return NextResponse.json({ success: true, base64: null, qrCode: null, code: null, pairingCode: null, status: 'connecting' });
    }

    if (!evoConfig.apiKey) throw new Error("Evolution API key is not configured.");

    const cacheKey = CacheKeys.qrCode(instanceName);

    // Check memory / Redis cache via QRManager
    const cached = await QRManager.getQR(instanceName);
    if (cached) {
      console.log('[QR RETURN LOG] Returning cached QR payload (Cache Hit).');
      const normalizedCached = {
        ...cached,
        qrCode: cached.qrCode || cached.base64 || cached.qrcode || null
      };
      return NextResponse.json(normalizedCached, { headers: { 'X-Cache': 'HIT' } });
    }

    // Set lock key before calling Evolution API to prevent consecutive calls resetting Baileys (405)
    await cacheSet(requestLockKey, true, 12); // Lock for 12 seconds

    let data: any;
    try {
      console.log('[QR REQUEST LOG] Calling EvolutionSDK.fetchQR for instance:', instanceName);
      data = await EvolutionSDK.fetchQR(instanceName);
      console.log('[QR RESPONSE LOG] Evolution response:', JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error('[QR REQUEST LOG] EvolutionSDK.fetchQR threw error:', error.message);
      if (isEvolutionUnavailableError(error)) {
        return NextResponse.json(
          { error: `Evolution API is unavailable. Start the service, then try again.` },
          { status: 503 }
        );
      }

      // Handle already-connected instance
      if (isAlreadyConnectedError(error)) {
        console.log('[QR REQUEST LOG] Instance already connected (from catch). Updating status to open...');
        await QRManager.persistStatus(dbInstance.id, 'open');
        return NextResponse.json({ success: true, base64: null, qrCode: null, code: null, pairingCode: null, status: 'open' });
      }

      const errMsg = error.message?.toLowerCase() || '';

      // Auto-recreate instance in Evolution API if it is not found (404)
      if (
        errMsg.includes('404') ||
        errMsg.includes('not found') ||
        errMsg.includes('instance not')
      ) {
        try {
          const WEBHOOK_URL = evoConfig.webhookUrl;
          const WEBHOOK_EVENTS = [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CHATS_UPDATE',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED',
            'CONTACTS_UPDATE',
          ];

          const evolutionPayload: Record<string, unknown> = {
            instanceName: dbInstance.instanceName,
            integration: dbInstance.integration,
            qrcode: dbInstance.integration === 'WHATSAPP-BAILEYS',
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
            rejectCall: false,
            groupsIgnore: true,
            alwaysOnline: true,
            readMessages: false,
            readStatus: false,
          };

          if (dbInstance.integration === 'WHATSAPP-BUSINESS') {
            evolutionPayload.token = dbInstance.metaToken;
            evolutionPayload.number = dbInstance.metaPhoneNumberId;
            evolutionPayload.businessId = dbInstance.metaBusinessId;
          } else if (dbInstance.instanceNumber) {
            evolutionPayload.number = dbInstance.instanceNumber;
          }

          console.log(`[QR REQUEST LOG] Auto-recreating missing instance ${dbInstance.instanceName} in Evolution API...`);
          const createData = await EvolutionSDK.createInstance(dbInstance.instanceName, evolutionPayload);
          const resolvedInstanceId =
            createData?.instance?.instanceId ||
            createData?.instance?.id ||
            createData?.instanceId ||
            createData?.id ||
            dbInstance.evolutionInstanceId ||
            dbInstance.instanceName;

          await QRManager.persistStatus(dbInstance.id, 'connecting', {
            evolutionInstanceId: String(resolvedInstanceId)
          });

          if (createData?.qrcode?.base64) {
            const normalized = await normalizeQrResponse(createData);
            const payload = {
              success: true,
              qrCode: normalized,
              base64: normalized,
              qrcode: normalized,
              code: createData.qrcode.code || null,
              pairingCode: createData.qrcode.pairingCode || null,
              status: 'waiting_qr',
            };
            await QRManager.setQR(instanceName, payload);
            return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
          }

          return NextResponse.json({ success: true, qrCode: null, base64: null, code: null, pairingCode: null, status: 'connecting' });
        } catch (recreateError: any) {
          console.error(`[QR REQUEST LOG] Failed to auto-recreate instance ${dbInstance.instanceName}:`, recreateError.message);
        }
      }

      // QR not yet generated (instance is initializing) — return null so UI can retry
      if (
        errMsg.includes('qr code') ||
        errMsg.includes('generating') ||
        errMsg.includes('connecting') ||
        errMsg.includes('initializing') ||
        errMsg.includes('500') ||
        errMsg.includes('json') || 
        errMsg.includes('unexpected end')
      ) {
        return NextResponse.json({ success: true, qrCode: null, base64: null, code: null, pairingCode: null, status: 'connecting' });
      }

      return NextResponse.json({ error: error.message || 'Failed to fetch QR Code from Evolution API.' }, { status: 500 });
    }

    // Handle case where Evolution returns data but with status 'open'
    if (data?.state === 'open' || data?.instance?.state === 'open') {
      console.log('[QR REQUEST LOG] Evolution returned state: open. Updating status in DB...');
      await QRManager.persistStatus(dbInstance.id, 'open');
      return NextResponse.json({ success: true, base64: null, qrCode: null, code: null, pairingCode: null, status: 'open' });
    }

    // Normalize Evolution response
    const normalizedQr = await normalizeQrResponse(data);
    if (!normalizedQr) {
      console.log('[QR RETURN LOG] QR could not be normalized. Returning connecting status.');
      return NextResponse.json({ success: true, qrCode: null, base64: null, code: null, pairingCode: null, status: 'connecting' });
    }

    // Since we have a valid QR code, clear the request lock so the client can refresh immediately if needed
    try {
      await cacheDel(requestLockKey);
    } catch {}

    const payload = {
      success: true,
      qrCode: normalizedQr,
      base64: normalizedQr,
      qrcode: normalizedQr,
      code: data?.code || data?.qrcode?.code || null,
      pairingCode: data?.pairingCode || data?.qrcode?.pairingCode || null,
      status: 'waiting_qr',
    };

    console.log('[QR RETURN LOG] Returning normalized QR payload:', JSON.stringify({
      success: payload.success,
      qrCodeLength: payload.qrCode?.length || 0,
      status: payload.status
    }));

    // Cache QR code in local memory & Redis
    console.log(`[QR_GENERATED] Generated new QR for ${instanceName}`);
    await QRManager.setQR(instanceName, payload);

    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
  } catch (error: any) {
    console.error('Error in API /api/instance/connect:', error.message);
    if (isEvolutionUnavailableError(error)) {
      return NextResponse.json({ error: 'Evolution API is unavailable. Start the service and try again.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
