
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats, contacts } from '@/lib/db/schema';
import { eq, and, or, like, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[API Contacts By Chat] Starting request');
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[API Contacts By Chat] Team found:', team.id);

    const jid = request.nextUrl.searchParams.get('jid');
    if (!jid) {
      return NextResponse.json({ error: 'jid (remoteJid) is required' }, { status: 400 });
    }
    console.log('[API Contacts By Chat] JID:', jid);


    let jidCondition;
    if (jid.endsWith('@g.us')) {
      jidCondition = eq(chats.remoteJid, jid);
    } else {
      const phone = jid.split('@')[0];
      jidCondition = or(
        eq(chats.remoteJid, jid),
        like(chats.remoteJid, `${phone}@%`)
      );
    }

    console.log('[API Contacts By Chat] Querying for chat');
    const chat = await db.query.chats.findFirst({
      where: and(
        eq(chats.teamId, team.id),
        jidCondition
      ),
      columns: { id: true }
    });

    console.log('[API Contacts By Chat] Chat found:', chat ? chat.id : null);
    if (!chat) {
      return NextResponse.json(null);
    }

    console.log('[API Contacts By Chat] Querying for contact');
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.chatId, chat.id),
        isNull(contacts.deletedAt)
      ),
      with: {
        assignedUser: { columns: { id: true, name: true, email: true } },
        assignedDepartment: { columns: { id: true, name: true } },
        funnelStage: true,
        contactTags: { with: { tag: true } }
      }
    });

    console.log('[API Contacts By Chat] Contact found:', contact ? contact.id : null);
    if (!contact) {
      return NextResponse.json(null);
    }

    
    const formattedContact = {
      ...contact,
      tags: contact.contactTags.map(ct => ct.tag) || []
    };
    delete (formattedContact as any).contactTags; 

    return NextResponse.json(formattedContact);

  } catch (error: any) {
    console.error('Error fetching contact:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}