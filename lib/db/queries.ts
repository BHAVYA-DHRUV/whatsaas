import { unstable_cache } from 'next/cache';
import { desc, and, eq, isNull, count } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, plans, contacts, evolutionInstances } from './schema';
import { cookies, headers } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  
  try {
    const authHeader = (await headers()).get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const sessionData = await verifyToken(token);
      if (sessionData?.user?.id && typeof sessionData.user.id === 'number') {
        if (new Date(sessionData.expires) >= new Date()) {
          const user = await db
            .select()
            .from(users)
            .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
            .limit(1);
          if (user.length > 0) return user[0];
        }
      }
    }
  } catch {
    
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

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

const loadPublishedPlans = unstable_cache(
  async () => {
    try {
      return await db.select().from(plans).orderBy(plans.amount);
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
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

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
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getTeamMemberCount(teamId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
  return result.count;
}

export async function getContactCount(teamId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(contacts)
    .where(eq(contacts.teamId, teamId));
  return result.count;
}

export async function getInstanceCount(teamId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(evolutionInstances)
    .where(eq(evolutionInstances.teamId, teamId));
  return result.count;
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
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
    .limit(10);
}

export async function getFreePlan() {
  const result = await db
    .select()
    .from(plans)
    .where(eq(plans.amount, 0))
    .limit(1);

  return result[0] || null;
}

/** Creates a default workspace when a user has no team (fixes 401 on /api/* after login). */
export async function ensureDefaultTeamForUser(userId: number, email: string) {
  const existing = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, userId),
    with: { team: true },
  });
  if (existing?.team) return existing.team;

  const teamName = email.includes('@') ? `${email.split('@')[0]}'s Team` : 'My Team';
  const [team] = await db.insert(teams).values({ name: teamName }).returning();

  const freePlan = await getFreePlan();
  if (freePlan) {
    await db
      .update(teams)
      .set({ planId: freePlan.id, planName: freePlan.name, subscriptionStatus: 'active' })
      .where(eq(teams.id, team.id));
  }

  await db.insert(teamMembers).values({
    userId,
    teamId: team.id,
    role: 'owner',
  });

  return team;
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
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
  });

  if (result?.team) return result.team;

  try {
    await ensureDefaultTeamForUser(user.id, user.email);
    const refreshed = await db.query.teamMembers.findFirst({
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
    });
    return refreshed?.team ?? null;
  } catch (error) {
    console.error('ensureDefaultTeamForUser failed:', error);
    return null;
  }
}

export async function getUserMembership() {
  const user = await getUser();
  if (!user) return null;

  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    columns: {
      role: true,
      permissions: true,
    }
  });

  return membership || null;
}
