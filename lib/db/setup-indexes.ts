import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

let indexesCreated = false;

export async function ensureIndexes() {
  if (indexesCreated) return;
  try {
    console.log('[INDEX SETUP] Creating database indexes and columns...');

    // ── Ensure runtime columns exist ─────────────────────────────────────────
    await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;`);
    await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false;`);
    await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamp;`);
    await db.execute(sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at timestamp;`);

    // ── Enable pg_trgm for fast ILIKE '%partial%' queries ────────────────────
    // Requires superuser on first run; subsequent calls are no-ops.
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
      console.log('[INDEX SETUP] pg_trgm extension enabled.');
    } catch (trgmErr: any) {
      console.warn('[INDEX SETUP] Could not enable pg_trgm (non-superuser?). Falling back to standard B-tree indexes.', trgmErr?.message);
    }

    // ── Standard B-tree indexes (always safe) ────────────────────────────────
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_last_message ON chats(last_message_timestamp DESC);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_unread_count ON chats(unread_count);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_phone_number ON contacts(phone);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_archived ON chats(is_archived);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_pinned ON chats(is_pinned);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_instance_id ON messages(instance_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_remote_jid ON messages(remote_jid);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_messages_is_starred ON messages(is_starred) WHERE is_starred = true;`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS messages_deleted_at_idx ON messages(deleted_at);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS contacts_deleted_at_idx ON contacts(deleted_at);`);

    // ── Composite index: team + archive flag + timestamp (chat list queries) ──
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_chats_team_archive_ts
      ON chats(team_id, is_archived, last_message_timestamp DESC);
    `);

    // ── Composite index: team + pinned + timestamp ────────────────────────────
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_chats_team_pinned_ts
      ON chats(team_id, is_pinned, last_message_timestamp DESC);
    `);

    // ── Composite index: team + unread ───────────────────────────────────────
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_chats_team_unread
      ON chats(team_id, unread_count)
      WHERE unread_count > 0;
    `);

    // ── GIN trigram indexes for fast partial-text search ─────────────────────
    // These are tried but silently skipped if pg_trgm is unavailable.
    const trgmIndexes: Array<{ name: string; ddl: string }> = [
      {
        name: 'idx_chats_name_trgm',
        ddl: `CREATE INDEX IF NOT EXISTS idx_chats_name_trgm ON chats USING gin(name gin_trgm_ops) WHERE name IS NOT NULL;`,
      },
      {
        name: 'idx_chats_push_name_trgm',
        ddl: `CREATE INDEX IF NOT EXISTS idx_chats_push_name_trgm ON chats USING gin(push_name gin_trgm_ops) WHERE push_name IS NOT NULL;`,
      },
      {
        name: 'idx_chats_remote_jid_trgm',
        ddl: `CREATE INDEX IF NOT EXISTS idx_chats_remote_jid_trgm ON chats USING gin(remote_jid gin_trgm_ops);`,
      },
      {
        name: 'idx_contacts_name_trgm',
        ddl: `CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(name gin_trgm_ops) WHERE name IS NOT NULL;`,
      },
      {
        name: 'idx_contacts_phone_trgm',
        ddl: `CREATE INDEX IF NOT EXISTS idx_contacts_phone_trgm ON contacts USING gin(phone gin_trgm_ops) WHERE phone IS NOT NULL;`,
      },
      {
        name: 'idx_messages_text_trgm',
        ddl: `CREATE INDEX IF NOT EXISTS idx_messages_text_trgm ON messages USING gin(text gin_trgm_ops) WHERE text IS NOT NULL;`,
      },
    ];

    for (const { name, ddl } of trgmIndexes) {
      try {
        await db.execute(sql.raw(ddl));
        console.log(`[INDEX SETUP] Created trigram index: ${name}`);
      } catch (err: any) {
        console.warn(`[INDEX SETUP] Skipped trigram index ${name}: ${err?.message}`);
      }
    }

    console.log('[INDEX SETUP] All indexes created successfully!');
    indexesCreated = true;
  } catch (error) {
    console.error('[INDEX SETUP] Error creating indexes:', error);
  }
}
