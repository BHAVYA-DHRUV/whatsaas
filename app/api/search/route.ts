import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { chats, messages, contacts, users, teams, evolutionInstances, teamMembers } from '@/lib/db/schema';
import { eq, or, and, ilike, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    const user = await getUser();
    if (!team || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // chats, messages, contacts, users, instances, all

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const results: any = {
      chats: [],
      messages: [],
      contacts: [],
      users: [],
      instances: [],
    };

    const searchPattern = `%${query}%`;

    // Search chats
    if (!type || type === 'all' || type === 'chats') {
      results.chats = await db.query.chats.findMany({
        where: and(
          eq(chats.teamId, team.id),
          or(
            ilike(chats.name, searchPattern),
            ilike(chats.remoteJid, searchPattern),
            ilike(chats.lastMessageText, searchPattern)
          )
        ),
        orderBy: [desc(chats.lastMessageTimestamp)],
        limit: 20,
      });
    }

    // Search messages
    if (!type || type === 'all' || type === 'messages') {
      results.messages = await db.query.messages.findMany({
        where: and(
          ilike(messages.text, searchPattern)
        ),
        with: {
          chat: {
            columns: {
              id: true,
              remoteJid: true,
              name: true,
              teamId: true,
            }
          }
        },
        orderBy: [desc(messages.timestamp)],
        limit: 50,
      });

      // Filter messages by teamId
      results.messages = results.messages.filter((msg: any) => msg.chat?.teamId === team.id);
    }

    // Search contacts
    if (!type || type === 'all' || type === 'contacts') {
      results.contacts = await db.query.contacts.findMany({
        where: and(
          eq(contacts.teamId, team.id),
          or(
            ilike(contacts.name, searchPattern),
            ilike(contacts.notes, searchPattern)
          )
        ),
        with: {
          chat: true,
          assignedUser: {
            columns: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        limit: 20,
      });
    }

    // Search users (team members only)
    if (!type || type === 'all' || type === 'users') {
      const teamMembersData = await db.query.teamMembers.findMany({
        where: eq(teamMembers.teamId, team.id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      results.users = teamMembersData
        .filter((tm: any) => 
          tm.user.name?.toLowerCase().includes(query.toLowerCase()) ||
          tm.user.email?.toLowerCase().includes(query.toLowerCase())
        )
        .map((tm: any) => tm.user);
    }

    // Search instances
    if (!type || type === 'all' || type === 'instances') {
      results.instances = await db.query.evolutionInstances.findMany({
        where: and(
          eq(evolutionInstances.teamId, team.id),
          or(
            ilike(evolutionInstances.displayName, searchPattern),
            ilike(evolutionInstances.instanceName, searchPattern)
          )
        ),
        limit: 20,
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in /api/search:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
