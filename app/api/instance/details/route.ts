import { NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries'; 
import { db } from '@/lib/db/drizzle'; 
import { evolutionInstances } from '@/lib/db/schema'; 
import { eq } from 'drizzle-orm';
import { EvolutionSDK } from '@/lib/whatsapp/evolution-sdk';
import { cacheGet, cacheSet } from '@/lib/cache/redis-cache';

type InstanceDetailItem = {
    dbId: number;
    instanceName: string;
    evolutionInstanceId: string | null;
    number: string | null;
    integration: string | null;
    owner: string | null;
    profileName: string | null;
    profilePictureUrl: string | null;
    status: string;
    token: string | null;
};

export async function GET(_request: Request) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbInstances = await db.query.evolutionInstances.findMany({
      where: eq(evolutionInstances.teamId, team.id),
      orderBy: (instances, { asc }) => [asc(instances.instanceName)],
    });

    if (dbInstances.length === 0) {
      return NextResponse.json([]);
    }

    // Use a fast timeout for Evolution API checks so page loads quickly
    const EVOLUTION_TIMEOUT_MS = 5000;

    const results = await Promise.all(dbInstances.map(async (dbInstance) => {
        const cacheKey = `cache:instance-details:${dbInstance.instanceName}`;
        const cached = await cacheGet<InstanceDetailItem>(cacheKey);
        if (cached) {
            return cached;
        }

        let status = dbInstance.status || 'unknown';
        let profileInfo: Partial<InstanceDetailItem> = {
          owner: null,
          profileName: dbInstance.profileName || null,
          profilePictureUrl: null,
          number: dbInstance.instanceNumber || null,
        };

        let detailItem: InstanceDetailItem;

        // Meta Cloud connection checking path
        if (dbInstance.integration === 'META-CLOUD') {
            try {
                const token = dbInstance.metaToken || dbInstance.accessToken;
                const phoneId = dbInstance.metaPhoneNumberId;
                if (token && phoneId) {
                    const metaResponse = await fetch(
                      `https://graph.facebook.com/v21.0/${phoneId}?fields=verified_name,display_phone_number,quality_rating`,
                      { headers: { 'Authorization': `Bearer ${token}` }, signal: AbortSignal.timeout(EVOLUTION_TIMEOUT_MS) }
                    );
                    if (metaResponse.ok) {
                        const metaData = await metaResponse.json();
                        status = 'open';
                        profileInfo = {
                            profileName: metaData.verified_name || null,
                            number: metaData.display_phone_number || dbInstance.instanceNumber || null,
                            integration: 'META-CLOUD',
                        };
                    } else if (metaResponse.status === 401 || metaResponse.status === 403) {
                        status = 'close';
                    }
                }
            } catch {
                // Fall through to use DB status
            }

            detailItem = {
                dbId: dbInstance.id,
                instanceName: dbInstance.displayName || dbInstance.instanceName,
                internalName: dbInstance.instanceName,
                evolutionInstanceId: dbInstance.evolutionInstanceId,
                status,
                token: dbInstance.accessToken,
                owner: profileInfo.owner ?? null,
                profileName: profileInfo.profileName ?? null,
                number: profileInfo.number ?? dbInstance.instanceNumber ?? null,
                integration: 'META-CLOUD',
                profilePictureUrl: profileInfo.profilePictureUrl ?? null,
            } as InstanceDetailItem;
        } else {
            // Evolution API connection checking path — use a fast timeout
            try {
                const stateData = await Promise.race([
                  EvolutionSDK.getConnectionState(dbInstance.instanceName),
                  new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), EVOLUTION_TIMEOUT_MS)),
                ]);
                
                const liveStatus = (stateData as any)?.instance?.state || (stateData as any)?.state || null;
                if (liveStatus) {
                  status = liveStatus;
                }

                if (status === 'open') {
                    try {
                      const identifier = dbInstance.evolutionInstanceId || dbInstance.instanceName;
                      const detailsArray = await Promise.race([
                        EvolutionSDK.fetchInstances(identifier),
                        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), EVOLUTION_TIMEOUT_MS)),
                      ]);
                      if (Array.isArray(detailsArray) && detailsArray.length > 0) {
                        const evoInstance = detailsArray[0];
                        profileInfo = {
                            owner: evoInstance?.owner || null,
                            profileName: evoInstance?.profileName || dbInstance.profileName || null,
                            profilePictureUrl: evoInstance?.profilePicUrl || null,
                            number: evoInstance?.number || dbInstance.instanceNumber || null,
                            integration: evoInstance?.integration || null,
                        };
                      }
                    } catch {
                      // Use DB fallback for profile info
                    }
                }
            } catch (fetchError: any) {
                // On timeout or error, fall back to DB status (don't block page load)
                if (fetchError.message?.includes('404')) {
                    status = 'close';
                }
                // else: keep the DB status (it may be 'open', 'connecting', etc.)
            }

            detailItem = {
                dbId: dbInstance.id,
                instanceName: dbInstance.displayName || dbInstance.instanceName,
                internalName: dbInstance.instanceName,
                evolutionInstanceId: dbInstance.evolutionInstanceId,
                status: status,
                token: dbInstance.accessToken,
                owner: profileInfo.owner ?? null,
                profileName: profileInfo.profileName ?? null,
                number: profileInfo.number ?? dbInstance.instanceNumber ?? null,
                integration: profileInfo.integration ?? dbInstance.integration ?? null,
                profilePictureUrl: profileInfo.profilePictureUrl ?? null,
            } as InstanceDetailItem;
        }

        await cacheSet(cacheKey, detailItem, 15);
        return detailItem;
    }));

    const instanceDetailsList = results.filter((item): item is InstanceDetailItem => item !== null);

    return NextResponse.json(instanceDetailsList);

  } catch (error: any) {
    console.error('Error fetching instance details:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
