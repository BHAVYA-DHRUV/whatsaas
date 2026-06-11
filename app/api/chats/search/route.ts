import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser } from '@/lib/db/queries';
import { chats, contacts, messages, contactTags, tags } from '@/lib/db/schema';
import { eq, or, and, ilike, desc, isNull, sql, gt } from 'drizzle-orm';
import { normalizeQuery, normalizePhone, isDigitOnlyQuery, likePattern } from '@/lib/search/normalize';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchTab = 'all' | 'unread' | 'pinned' | 'archived' | 'starred' | 'media';

interface ChatResult {
  type: 'chat';
  id: string;
  chat: {
    id: number;
    remoteJid: string;
    name: string;
    profilePicUrl: string | null;
    lastMessageText: string | null;
    lastMessageTimestamp: string | null;
    unreadCount: number;
    isPinned: boolean;
    isArchived: boolean;
    instanceId: number | null;
  };
  matchedMessage: null;
}

interface MessageResult {
  type: 'message';
  id: string;
  chat: {
    id: number;
    remoteJid: string;
    name: string;
    profilePicUrl: string | null;
    unreadCount: number;
    isPinned: boolean;
    isArchived: boolean;
    instanceId: number | null;
  };
  matchedMessage: {
    id: string;
    text: string | null;
    timestamp: string;
    fromMe: boolean;
    isStarred: boolean;
  };
}

// ─── Helper: build phone-normalized SQL condition ─────────────────────────────

/**
 * Builds a SQL expression that compares the digit-stripped version of a
 * database column against the digit-stripped version of the user query.
 *
 * regexp_replace(column, '\D', '', 'g') LIKE '%digits%'
 */
function phoneDigitMatch(column: any, digitsQuery: string) {
  const pattern = likePattern(digitsQuery);
  return sql`regexp_replace(${column}, '\\D', '', 'g') ILIKE ${pattern}`;
}

function getDisplayName(
  remoteJid: string,
  name?: string | null,
  pushName?: string | null,
  contactName?: string | null
): string {
  const phone = remoteJid.split('@')[0];
  
  if (contactName && contactName.trim() !== '' && contactName !== phone && contactName !== `+${phone}`) {
    return contactName;
  }

  if (pushName && pushName.trim() !== '' && pushName !== phone && pushName !== `+${phone}`) {
    return pushName;
  }

  if (name && name.trim() !== '' && name !== phone && name !== `+${phone}`) {
    return name;
  }

  return phone || 'Unknown';
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') ?? '';
    const tab = (searchParams.get('tab') ?? 'all') as SearchTab;

    // ── Validate & normalize query ──────────────────────────────────────────
    const trimmed = rawQuery.trim();

    // Allow 1-char search ONLY if it's a digit (phone number search).
    // Otherwise require at least 2 characters.
    const isPhone = isDigitOnlyQuery(trimmed);
    if (trimmed.length < 1 || (trimmed.length < 2 && !isPhone)) {
      return NextResponse.json([]);
    }

    const normQuery = normalizeQuery(trimmed);     // symbol-stripped, lowercase
    const phoneDigits = normalizePhone(trimmed);    // digits only (may be empty)
    const textPattern = likePattern(normQuery);     // %normalized%

    // ── Build tab-specific chat conditions ──────────────────────────────────
    const tabConditions: any[] = [];

    if (tab === 'archived') {
      tabConditions.push(eq(chats.isArchived, true));
    } else {
      // All non-archived tabs: never show archived chats in chat results
      tabConditions.push(or(eq(chats.isArchived, false), isNull(chats.isArchived)));

      if (tab === 'pinned') {
        tabConditions.push(eq(chats.isPinned, true));
      } else if (tab === 'unread') {
        tabConditions.push(gt(chats.unreadCount, 0));
      }
      // 'starred', 'media', and 'all' don't restrict which chats appear —
      // messages with isStarred or media are handled in the message search section.
    }

    // ── 1. Search chats & contacts ──────────────────────────────────────────
    // Build name/text match conditions
    const nameConditions: any[] = [
      ilike(chats.name, textPattern),
      ilike(chats.pushName, textPattern),
      ilike(contacts.name, textPattern),
    ];

    // Phone search: if the query contains only digits, do digit-stripped match
    // on remoteJid and contacts.phone; otherwise also try ilike on raw fields.
    if (phoneDigits.length > 0) {
      nameConditions.push(phoneDigitMatch(chats.remoteJid, phoneDigits));
      nameConditions.push(phoneDigitMatch(contacts.phone, phoneDigits));
    }

    // Also try raw ilike on remoteJid/phone for non-digit queries (e.g. "@g.us")
    if (!isPhone) {
      nameConditions.push(ilike(chats.remoteJid, textPattern));
      nameConditions.push(ilike(contacts.phone, textPattern));
      nameConditions.push(ilike(contacts.notes, textPattern));
      nameConditions.push(ilike(tags.name, textPattern));
    }

    const chatMatches = await db
      .select({
        chatId: chats.id,
        remoteJid: chats.remoteJid,
        name: chats.name,
        pushName: chats.pushName,
        profilePicUrl: chats.profilePicUrl,
        lastMessageText: chats.lastMessageText,
        lastMessageTimestamp: chats.lastMessageTimestamp,
        unreadCount: chats.unreadCount,
        isPinned: chats.isPinned,
        isArchived: chats.isArchived,
        instanceId: chats.instanceId,
        contactName: contacts.name,
        contactPhone: contacts.phone,
      })
      .from(chats)
      .leftJoin(contacts, and(eq(chats.id, contacts.chatId), isNull(contacts.deletedAt)))
      .leftJoin(contactTags, eq(contacts.id, contactTags.contactId))
      .leftJoin(tags, eq(contactTags.tagId, tags.id))
      .where(
        and(
          eq(chats.teamId, team.id),
          isNull(chats.deletedAt),
          ...tabConditions,
          or(...nameConditions),
        )
      )
      .orderBy(desc(chats.lastMessageTimestamp))
      .limit(60);

    // ── 2. Search messages ──────────────────────────────────────────────────
    // For phone-only queries we skip message text search (no text to match).
    // For starred tab: return starred messages matching query OR all starred
    // messages in matching chats.
    const messageConditions: any[] = [
      eq(chats.teamId, team.id),
      isNull(chats.deletedAt),
    ];

    // Tab-specific message scoping
    if (tab === 'archived') {
      messageConditions.push(eq(chats.isArchived, true));
    } else {
      messageConditions.push(or(eq(chats.isArchived, false), isNull(chats.isArchived)));
    }

    if (tab === 'starred') {
      // Starred tab: show starred messages that match query text,
      // PLUS all starred messages in chats whose name matches query.
      messageConditions.push(eq(messages.isStarred, true));
      if (!isPhone) {
        messageConditions.push(
          or(
            ilike(messages.text, textPattern),        // (a) message text matches
            ilike(chats.name, textPattern),            // (b) chat name matches
            ilike(chats.pushName, textPattern),
            ilike(contacts.name, textPattern),
          )
        );
      }
    } else if (tab === 'media') {
      // Media tab: show messages with media (images, videos, audio, documents)
      messageConditions.push(sql`${messages.mediaUrl} IS NOT NULL`);
      if (!isPhone) {
        messageConditions.push(
          or(
            ilike(messages.text, textPattern),        // (a) message text matches
            ilike(messages.mediaCaption, textPattern), // (b) media caption matches
            ilike(chats.name, textPattern),            // (c) chat name matches
            ilike(chats.pushName, textPattern),
            ilike(contacts.name, textPattern),
          )
        );
      }
    } else if (!isPhone) {
      // Regular tabs: search message text
      messageConditions.push(
        // Normalize the search in the DB too via ILIKE on the text column
        ilike(messages.text, textPattern)
      );
    }

    let messageMatches: any[] = [];

    if (!isPhone || tab === 'starred' || tab === 'media') {
      const flatRows = await db
        .select({
          msgId: messages.id,
          chatId: messages.chatId,
          text: messages.text,
          timestamp: messages.timestamp,
          fromMe: messages.fromMe,
          isStarred: messages.isStarred,
          chatDbId: chats.id,
          chatRemoteJid: chats.remoteJid,
          chatName: chats.name,
          chatPushName: chats.pushName,
          chatProfilePicUrl: chats.profilePicUrl,
          chatUnreadCount: chats.unreadCount,
          chatIsPinned: chats.isPinned,
          chatIsArchived: chats.isArchived,
          chatInstanceId: chats.instanceId,
          chatContactName: contacts.name,
        })
        .from(messages)
        .innerJoin(chats, and(eq(messages.chatId, chats.id), isNull(chats.deletedAt)))
        .leftJoin(contacts, and(eq(chats.id, contacts.chatId), isNull(contacts.deletedAt)))
        .where(and(...messageConditions))
        .orderBy(desc(messages.timestamp))
        .limit(tab === 'starred' || tab === 'media' ? 50 : 30);

      // Re-shape flat rows into the nested structure the formatter expects
      messageMatches = flatRows.map((r) => ({
        id: r.msgId,
        chatId: r.chatId,
        text: r.text,
        timestamp: r.timestamp,
        fromMe: r.fromMe,
        isStarred: r.isStarred,
        chat: {
          id: r.chatDbId,
          remoteJid: r.chatRemoteJid,
          name: getDisplayName(r.chatRemoteJid, r.chatName, r.chatPushName, r.chatContactName),
          profilePicUrl: r.chatProfilePicUrl,
          unreadCount: r.chatUnreadCount,
          isPinned: r.chatIsPinned,
          isArchived: r.chatIsArchived,
          instanceId: r.chatInstanceId,
        },
      }));
    }

    // ── 3. Format & deduplicate results ─────────────────────────────────────
    const results: Array<ChatResult | MessageResult> = [];
    const seenChatIds = new Set<number>();

    // Chat results (deduplicated)
    for (const c of chatMatches) {
      if (seenChatIds.has(c.chatId)) continue;
      seenChatIds.add(c.chatId);

      const displayName = getDisplayName(c.remoteJid, c.name, c.pushName, c.contactName);

      results.push({
        type: 'chat',
        id: `chat-${c.chatId}`,
        chat: {
          id: c.chatId,
          remoteJid: c.remoteJid,
          name: displayName,
          profilePicUrl: c.profilePicUrl,
          lastMessageText: c.lastMessageText,
          lastMessageTimestamp: c.lastMessageTimestamp?.toISOString() ?? null,
          unreadCount: c.unreadCount || 0,
          isPinned: c.isPinned,
          isArchived: c.isArchived,
          instanceId: c.instanceId,
        },
        matchedMessage: null,
      });
    }

    // Message results (deduplicated per unique message id)
    const seenMsgIds = new Set<string>();
    for (const m of messageMatches) {
      if (seenMsgIds.has(m.id)) continue;
      seenMsgIds.add(m.id);

      results.push({
        type: 'message',
        id: `msg-${m.id}`,
        chat: {
          id: m.chat.id,
          remoteJid: m.chat.remoteJid,
          name: m.chat.name,
          profilePicUrl: m.chat.profilePicUrl,
          unreadCount: m.chat.unreadCount || 0,
          isPinned: m.chat.isPinned,
          isArchived: m.chat.isArchived,
          instanceId: m.chat.instanceId,
        },
        matchedMessage: {
          id: m.id,
          text: m.text,
          timestamp: m.timestamp.toISOString(),
          fromMe: m.fromMe,
          isStarred: m.isStarred,
        },
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[/api/chats/search] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
