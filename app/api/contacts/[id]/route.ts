import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { contacts, contactTags } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cacheInvalidateTeam } from '@/lib/cache/redis-cache';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const contactId = parseInt(id);
    const body = await request.json();
    
    const {
      name,
      notes,
      assignedUserId,
      assignedDepartmentId,
      funnelStageId,
      tagIds,
      showTimeInStage,
      customData
    } = body;

    await db.transaction(async (tx) => {
        const updateData: any = { updatedAt: new Date() };
        
        if (name !== undefined) updateData.name = name;
        if (notes !== undefined) updateData.notes = notes;
        if (assignedUserId !== undefined) updateData.assignedUserId = assignedUserId ? parseInt(assignedUserId) : null;
        if (assignedDepartmentId !== undefined) updateData.assignedDepartmentId = assignedDepartmentId ? parseInt(assignedDepartmentId) : null;
        if (funnelStageId !== undefined) updateData.funnelStageId = funnelStageId ? parseInt(funnelStageId) : null;
        if (showTimeInStage !== undefined) updateData.showTimeInStage = showTimeInStage; 
        
        if (customData !== undefined) updateData.customData = customData;

        await tx.update(contacts)
            .set(updateData)
            .where(and(eq(contacts.id, contactId), eq(contacts.teamId, team.id)));

        if (tagIds) {
            await tx.delete(contactTags).where(eq(contactTags.contactId, contactId));
            if (tagIds.length > 0) {
                const newTags = tagIds.map((tId: number) => ({
                    contactId,
                    tagId: tId
                }));
                await tx.insert(contactTags).values(newTags);
            }
        }
    });

    await cacheInvalidateTeam(team.id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: 'Error updating contact' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const team = await getTeamForUser();
      if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { id } = await params;
      const contactId = parseInt(id);
      const deleted = await db.update(contacts)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(contacts.id, contactId), eq(contacts.teamId, team.id)))
        .returning();
      if (!deleted.length) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
      await cacheInvalidateTeam(team.id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: 'Error deleting contact' }, { status: 500 });
    }
}