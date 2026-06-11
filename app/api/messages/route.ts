import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle'; 
import { getTeamForUser } from '@/lib/db/queries'; 
import { chats, messages } from '@/lib/db/schema'; 
import { eq, and, or, like, asc, desc, lt, sql, isNull } from 'drizzle-orm';
import { formatMessageForFrontend } from '@/lib/db/messages';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[API Messages] Starting request');
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[API Messages] Team found:', team.id);

    const searchParams = request.nextUrl.searchParams;
    const jid = searchParams.get('jid');
    const instanceId = searchParams.get('instanceId');
    const chatId = searchParams.get('chatId');
    console.log('[API Messages] Query params:', { jid, instanceId, chatId });

    let chat;

    if (chatId) {
        console.log('[API Messages] Querying by chatId:', chatId);
        chat = await db.query.chats.findFirst({
            where: and(
                eq(chats.teamId, team.id),
                eq(chats.id, parseInt(chatId)),
                isNull(chats.deletedAt)
            ),
            columns: { id: true }
        });
    } else {
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

        const conditions = [
            eq(chats.teamId, team.id),
            jidCondition
        ];

        if (instanceId) {
            conditions.push(eq(chats.instanceId, parseInt(instanceId)));
        }

        console.log('[API Messages] Querying for chat with conditions');
        chat = await db.query.chats.findFirst({
            where: and(
                ...conditions,
                isNull(chats.deletedAt)
            ),
            columns: { id: true }
        });
    }

    console.log('[API Messages] Chat found:', chat ? chat.id : null);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    const messageId = searchParams.get('messageId');
    if (messageId) {
      const targetMsg = await db.query.messages.findFirst({
        where: and(
          eq(messages.id, messageId),
          eq(messages.chatId, chat.id),
          isNull(messages.deletedAt)
        )
      });

      if (targetMsg) {
        const older = await db.query.messages.findMany({
          where: and(
            eq(messages.chatId, chat.id),
            lt(messages.timestamp, targetMsg.timestamp),
            isNull(messages.deletedAt)
          ),
          orderBy: [desc(messages.timestamp)],
          limit: 30,
          with: {
            reactions: {
              columns: {
                id: true,
                emoji: true,
                fromMe: true,
                remoteJid: true,
                participantName: true,
              },
            },
          },
        });

        const newer = await db.query.messages.findMany({
          where: and(
            eq(messages.chatId, chat.id),
            sql`${messages.timestamp} >= ${targetMsg.timestamp}`,
            isNull(messages.deletedAt)
          ),
          orderBy: [asc(messages.timestamp)],
          limit: 20,
          with: {
            reactions: {
              columns: {
                id: true,
                emoji: true,
                fromMe: true,
                remoteJid: true,
                participantName: true,
              },
            },
          },
        });

        const combined = [...[...older].reverse(), ...newer];

        return NextResponse.json({
          messages: combined.map(msg => formatMessageForFrontend(msg)),
          hasMore: older.length === 30,
        });
      }
    }

    const limitParam = searchParams.get('limit');
    const before = searchParams.get('before');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 200) : null;

    if (limit) {
      const conditions = [eq(messages.chatId, chat.id), isNull(messages.deletedAt)];
      if (before) {
        conditions.push(lt(messages.timestamp, new Date(before)));
      }

      const batch = await db.query.messages.findMany({
        where: and(...conditions),
        orderBy: [desc(messages.timestamp)],
        limit: limit + 1,
        with: {
          reactions: {
            columns: {
              id: true,
              emoji: true,
              fromMe: true,
              remoteJid: true,
              participantName: true,
            },
          },
        },
      });

      const hasMore = batch.length > limit;
      const slicedBatch = hasMore ? batch.slice(0, limit) : batch;
      const ordered = [...slicedBatch].reverse();

      return NextResponse.json({
        messages: ordered.map(msg => formatMessageForFrontend(msg)),
        hasMore,
      });
    }

    const chatMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.chatId, chat.id),
        isNull(messages.deletedAt)
      ),
      orderBy: [asc(messages.timestamp)],
      with: {
        reactions: {
          columns: {
            id: true,
            emoji: true,
            fromMe: true,
            remoteJid: true,
            participantName: true,
          },
        },
      },
    });

    return NextResponse.json(chatMessages.map(msg => formatMessageForFrontend(msg)));

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}