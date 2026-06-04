import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import {
  users,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getUser();

    return Response.json(user, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[User GET] Error:', error.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      email,
      enableSignature,
    } = body;

    if (!name || !email) {
      return Response.json(
        {
          error: 'Name and email are required',
        },
        { status: 400 }
      );
    }

    const userWithTeam = await getUserWithTeam(
      user.id
    );

    await Promise.all([
      db
        .update(users)
        .set({
          name,
          email,
          enableSignature:
            !!enableSignature,
        })
        .where(eq(users.id, user.id)),

      userWithTeam?.teamId
        ? db.insert(activityLogs).values({
            teamId: userWithTeam.teamId,
            userId: user.id,
            action:
              ActivityType.UPDATE_ACCOUNT,
          })
        : Promise.resolve(),
    ]);

    const updatedUser = await getUser();

    return Response.json(updatedUser, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[User PUT] Error:', error.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}