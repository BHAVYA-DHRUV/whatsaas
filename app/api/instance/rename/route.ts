import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { evolutionInstances } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const team = await getTeamForUser();
    if (!team || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const instanceName = request.nextUrl.searchParams.get('instanceName');
    if (!instanceName) return NextResponse.json({ error: 'Instance name is required' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const newDisplayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 50) : null;
    if (!newDisplayName) return NextResponse.json({ error: 'displayName is required' }, { status: 400 });

    const dbInstance = await db.query.evolutionInstances.findFirst({
      where: and(eq(evolutionInstances.teamId, team.id), eq(evolutionInstances.instanceName, instanceName)),
      columns: { id: true }
    });

    if (!dbInstance) return NextResponse.json({ error: 'Instance not found or unauthorized' }, { status: 404 });

    await db.update(evolutionInstances).set({ displayName: newDisplayName }).where(eq(evolutionInstances.id, dbInstance.id));

    return NextResponse.json({ success: true, displayName: newDisplayName });
  } catch (error: any) {
    console.error('Error in /api/instance/rename:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
