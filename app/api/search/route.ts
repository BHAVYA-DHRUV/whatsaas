import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { chats, messages, contacts, evolutionInstances, teamMembers } from '@/lib/db/schema';
import { eq, or, and, ilike, desc, sql, isNull, gt } from 'drizzle-orm';
import { normalizeQuery, normalizePhone, isDigitOnlyQuery, likePattern } from '@/lib/search/normalize';

export const dynamic = 'force-dynamic';

/**
 * Enterprise-grade Global search — WhatsApp Web-like behavior.
 *
 * Features:
 * - Case-insensitive search
 * - Symbol-stripping normalization (john.doe matches "John Doe")
 * - Phone digit-only matching (9016 matches "+91 90160 61520")
 * - Partial matching on names, phones, message content
 * - Filter by archived, pinned, unread, starred
 * - Excludes archived chats by default in main search
 * - No duplicate results
 * - Optimized with GIN indexes
 */
export async function GET(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    const user = await getUser();
    if (!team || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q') ?? '';
    const type = searchParams.get('type'); // chats | messages | contacts | users | instances | all
    const filter = searchParams.get('filter'); // archived | pinned | unread | starred | all (default)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const trimmed = rawQuery.trim();
    const isPhone = isDigitOnlyQuery(trimmed);

    // Allow 1-char search only for digit-only (phone) queries
    if (trimmed.length < 1 || (trimmed.length < 2 && !isPhone)) {
      return NextResponse.json({ error: 'Query must be at least 2 characters (or 1 digit for phone search)' }, { status: 400 });
    }

    const normQuery = normalizeQuery(trimmed);
    const phoneDigits = normalizePhone(trimmed);
    const textPattern = likePattern(normQuery);

    const results: any = {
      chats: [],
      messages: [],
      contacts: [],
      users: [],
      instances: [],
    };

    // Build base conditions for archived/pinned/unread filters
    const chatFilterConditions: any[] = [];
    
    if (filter === 'archived') {
      chatFilterConditions.push(eq(chats.isArchived, true));
    } else if (filter === 'pinned') {
      chatFilterConditions.push(and(eq(chats.isPinned, true), or(eq(chats.isArchived, false), isNull(chats.isArchived))));
    } else if (filter === 'unread') {
      chatFilterConditions.push(and(gt(chats.unreadCount, 0), or(eq(chats.isArchived, false), isNull(chats.isArchived))));
    } else {
      // Default: exclude archived chats
      chatFilterConditions.push(or(eq(chats.isArchived, false), isNull(chats.isArchived)));
    }

    // ── Search chats ──────────────────────────────────────────────────────────
    if (!type || type === 'all' || type === 'chats') {
      const chatConditions: any[] = [
        ilike(chats.name, textPattern),
        ilike(chats.pushName, textPattern),
        ilike(chats.remoteJid, textPattern),
        ilike(chats.lastMessageText, textPattern),
      ];

      if (phoneDigits.length > 0) {
        // Optimized phone search using regex_replace for partial matching
        chatConditions.push(
          sql`regexp_replace(${chats.remoteJid}, '\\D', '', 'g') ILIKE ${likePattern(phoneDigits)}`
        );
      }

      results.chats = await db.query.chats.findMany({
        where: and(
          eq(chats.teamId, team.id),
          isNull(chats.deletedAt),
          ...chatFilterConditions,
          or(...chatConditions)
        ),
        orderBy: [
          desc(chats.isPinned),
          desc(chats.lastMessageTimestamp)
        ],
        limit,
      });
    }

    // ── Search messages ───────────────────────────────────────────────────────
    if (!isPhone && (!type || type === 'all' || type === 'messages')) {
      const messageConditions: any[] = [
        ilike(messages.text, textPattern),
        ilike(messages.mediaCaption, textPattern),
      ];

      // Filter starred messages if requested
      if (filter === 'starred') {
        messageConditions.push(eq(messages.isStarred, true));
      }

      const rawMessages = await db.query.messages.findMany({
        where: and(
          ...messageConditions,
          isNull(messages.deletedAt)
        ),
        with: {
          chat: {
            columns: {
              id: true,
              remoteJid: true,
              name: true,
              teamId: true,
              isArchived: true,
            }
          }
        },
        orderBy: [desc(messages.timestamp)],
        limit: filter === 'starred' ? limit : 50,
      });

      // Filter to current team only and exclude archived chats (unless filter is archived)
      results.messages = rawMessages.filter((msg: any) => {
        if (msg.chat?.teamId !== team.id) return false;
        if (filter === 'archived') return msg.chat?.isArchived === true;
        return msg.chat?.isArchived === false;
      });
    }

    // ── Search contacts ───────────────────────────────────────────────────────
    if (!type || type === 'all' || type === 'contacts') {
      const contactConditions: any[] = [
        ilike(contacts.name, textPattern),
        ilike(contacts.pushName, textPattern),
        ilike(contacts.notes, textPattern),
      ];

      if (phoneDigits.length > 0) {
        // Optimized phone search
        contactConditions.push(
          sql`regexp_replace(${contacts.phone}, '\\D', '', 'g') ILIKE ${likePattern(phoneDigits)}`
        );
      } else {
        contactConditions.push(ilike(contacts.phone, textPattern));
      }

      results.contacts = await db.query.contacts.findMany({
        where: and(
          eq(contacts.teamId, team.id),
          isNull(contacts.deletedAt),
          or(...contactConditions)
        ),
        with: {
          chat: {
            columns: {
              id: true,
              remoteJid: true,
              isArchived: true,
            }
          },
          assignedUser: {
            columns: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: [desc(contacts.updatedAt)],
        limit,
      });

      // Exclude archived chats from contact results (unless filter is archived)
      if (filter !== 'archived') {
        results.contacts = results.contacts.filter((c: any) => c.chat?.isArchived !== true);
      }
      // Exclude soft-deleted chats from contact results
      results.contacts = results.contacts.filter((c: any) => !c.chat?.deletedAt);
    }

    // ── Search users (team members) ───────────────────────────────────────────
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
          normalizeQuery(tm.user.name ?? '').includes(normQuery) ||
          (tm.user.email ?? '').toLowerCase().includes(normQuery)
        )
        .map((tm: any) => tm.user);
    }

    // ── Search instances ──────────────────────────────────────────────────────
    if (!type || type === 'all' || type === 'instances') {
      results.instances = await db.query.evolutionInstances.findMany({
        where: and(
          eq(evolutionInstances.teamId, team.id),
          or(
            ilike(evolutionInstances.displayName, textPattern),
            ilike(evolutionInstances.instanceName, textPattern),
            ilike(evolutionInstances.profileName, textPattern)
          )
        ),
        orderBy: [desc(evolutionInstances.connectedAt)],
        limit,
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[/api/search] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
