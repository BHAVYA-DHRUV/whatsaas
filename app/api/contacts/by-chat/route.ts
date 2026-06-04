
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats, contacts } from '@/lib/db/schema';
import { eq, and, or, like } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jid = request.nextUrl.searchParams.get('jid');
    if (!jid) {
      return NextResponse.json({ error: 'jid (remoteJid) is required' }, { status: 400 });
    }

    
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

    const chat = await db.query.chats.findFirst({
      where: and(
        eq(chats.teamId, team.id),
        jidCondition
      ),
      columns: { id: true }
    });

    if (!chat) {
      
      return NextResponse.json(null);
    }

    
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.chatId, chat.id),
      with: {
        assignedUser: { columns: { id: true, name: true, email: true } },
        assignedDepartment: { columns: { id: true, name: true } },
        funnelStage: true,
        contactTags: { with: { tag: true } }
      }
    });

    
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
    console.error('Error fetching contact:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}