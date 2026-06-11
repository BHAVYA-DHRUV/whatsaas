import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { desc, and, eq, isNull, count } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, plans, contacts, evolutionInstances } from './schema';
import { cookies, headers } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

const DEFAULT_DB_QUERY_TIMEOUT = Number(process.env.DB_QUERY_TIMEOUT_MS) || 5000;

const queryWithTimeout = <T>(promise: Promise<T>, ms = DEFAULT_DB_QUERY_TIMEOUT): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Database query timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

async function queryWithRetry<T>(
  operation: () => Promise<T>,
  ms = DEFAULT_DB_QUERY_TIMEOUT,
  retries = 3
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await queryWithTimeout(operation(), ms);
    } catch (error: any) {
      lastError = error;
      console.warn(`[Database Retry] Attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.min(100 * Math.pow(2, attempt), 1000)));
      }
    }
  }
  throw lastError;
}

export const getUser = cache(async () => {
  try {
    const authHeader = (await headers()).get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionData = await verifyToken(token);
      if (sessionData?.user?.id && typeof sessionData.user.id === 'number') {
        if (new Date(sessionData.expires) >= new Date()) {
          const user = await queryWithRetry(() => db
            .select()
            .from(users)
            .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
            .limit(1)
          );
          if (user.length > 0) return user[0];
        }
      }
    }
  } catch {
    // ignore header auth errors and fallback to cookie session
  }

  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await queryWithRetry(() => db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1)
  );

  if (user.length === 0) {
    return null;
  }

  return user[0];
});

const loadPublishedPlans = unstable_cache(
  async () => {
    try {
      return await queryWithRetry(() => db.select().from(plans).orderBy(plans.amount));
    } catch (error) {
      console.error('getPublishedPlans failed (run pnpm db:bootstrap):', error);
      return [];
    }
  },
  ['published-plans'],
  { revalidate: 300, tags: ['plans'] }
);

export async function getPublishedPlans() {
  return loadPublishedPlans();
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await queryWithRetry(() => db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1)
  );

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await queryWithRetry(() => db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId))
  );
}

export async function getUserWithTeam(userId: number) {
  const result = await queryWithRetry(() => db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1)
  );

  return result[0];
}

export async function getTeamMemberCount(teamId: number) {
  const [result] = await queryWithRetry(() => db
    .select({ count: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
  );
  return result.count;
}

export async function getContactCount(teamId: number) {
  const [result] = await queryWithRetry(() => db
    .select({ count: count() })
    .from(contacts)
    .where(and(
      eq(contacts.teamId, teamId),
      isNull(contacts.deletedAt)
    ))
  );
  return result.count;
}

export async function getInstanceCount(teamId: number) {
  const [result] = await queryWithRetry(() => db
    .select({ count: count() })
    .from(evolutionInstances)
    .where(eq(evolutionInstances.teamId, teamId))
  );
  return result.count;
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await queryWithRetry(() => db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10)
  );
}

export async function getFreePlan() {
  const result = await queryWithRetry(() => db
    .select()
    .from(plans)
    .where(eq(plans.amount, 0))
    .limit(1)
  );

  return result[0] || null;
}

/** Creates a default workspace when a user has no team (fixes 401 on /api/* after login). */
export async function ensureDefaultTeamForUser(userId: number, email: string) {
  const existing = await queryWithRetry(() => db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userId),
    with: { team: true },
  }));
  if (existing?.team) return existing.team;

  const teamName = email.includes('@') ? `${email.split('@')[0]}'s Team` : 'My Team';
  const [team] = await queryWithRetry(() => db.insert(teams).values({ name: teamName }).returning());

  const freePlan = await getFreePlan();
  if (freePlan) {
    await queryWithRetry(() => db
      .update(teams)
      .set({ planId: freePlan.id, planName: freePlan.name, subscriptionStatus: 'active' })
      .where(eq(teams.id, team.id))
    );
  }

  await queryWithRetry(() => db.insert(teamMembers).values({
    userId,
    teamId: team.id,
    role: 'owner',
  }));

  return team;
}

export const getTeamForUser = cache(async () => {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await queryWithRetry(() => db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          evolutionInstances: true
        }
      }
    }
  }));

  if (result?.team) return result.team;

  try {
    await ensureDefaultTeamForUser(user.id, user.email);
    const refreshed = await queryWithRetry(() => db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id),
      with: {
        team: {
          with: {
            teamMembers: {
              with: {
                user: {
                  columns: { id: true, name: true, email: true },
                },
              },
            },
            evolutionInstances: true,
          },
        },
      },
    }));
    return refreshed?.team ?? null;
  } catch (error) {
    console.error('ensureDefaultTeamForUser failed:', error);
    return null;
  }
});

export const getUserMembership = cache(async () => {
  const user = await getUser();
  if (!user) return null;

  const membership = await queryWithRetry(() => db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    columns: {
      role: true,
      permissions: true,
    }
  }));

  return membership || null;
});
