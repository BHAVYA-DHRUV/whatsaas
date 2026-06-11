-- Migration: Add GIN indexes for enterprise-grade search optimization
-- These indexes optimize text search performance for WhatsApp-like global search
-- including case-insensitive search, phone number matching, and partial matching

-- GIN indexes for chats table (text search optimization)
CREATE INDEX IF NOT EXISTS chats_name_gin_idx ON chats USING gin (name);
CREATE INDEX IF NOT EXISTS chats_push_name_gin_idx ON chats USING gin (push_name);
CREATE INDEX IF NOT EXISTS chats_last_message_text_gin_idx ON chats USING gin (last_message_text);
CREATE INDEX IF NOT EXISTS chats_remote_jid_gin_idx ON chats USING gin (remote_jid);

-- Composite indexes for filtered searches
CREATE INDEX IF NOT EXISTS chats_team_archived_pinned_idx ON chats (team_id, is_archived, is_pinned);
CREATE INDEX IF NOT EXISTS chats_team_unread_idx ON chats (team_id, unread_count);

-- GIN indexes for messages table (text search optimization)
CREATE INDEX IF NOT EXISTS messages_text_gin_idx ON messages USING gin (text);
CREATE INDEX IF NOT EXISTS messages_media_caption_gin_idx ON messages USING gin (media_caption);

-- Composite index for starred messages search
CREATE INDEX IF NOT EXISTS messages_chat_starred_idx ON messages (chat_id, is_starred);

-- GIN indexes for contacts table (text search optimization)
CREATE INDEX IF NOT EXISTS contacts_name_gin_idx ON contacts USING gin (name);
CREATE INDEX IF NOT EXISTS contacts_phone_gin_idx ON contacts USING gin (phone);
CREATE INDEX IF NOT EXISTS contacts_push_name_gin_idx ON contacts USING gin (push_name);
CREATE INDEX IF NOT EXISTS contacts_notes_gin_idx ON contacts USING gin (notes);

-- Comment explaining the purpose
COMMENT ON INDEX chats_name_gin_idx IS 'GIN index for fast case-insensitive text search on chat names';
COMMENT ON INDEX chats_push_name_gin_idx IS 'GIN index for fast case-insensitive text search on push names';
COMMENT ON INDEX chats_last_message_text_gin_idx IS 'GIN index for fast case-insensitive text search on last message text';
COMMENT ON INDEX chats_remote_jid_gin_idx IS 'GIN index for fast case-insensitive text search on remote JID (phone numbers)';
COMMENT ON INDEX chats_team_archived_pinned_idx IS 'Composite index for filtered searches by team, archived, and pinned status';
COMMENT ON INDEX chats_team_unread_idx IS 'Composite index for unread chat searches by team';
COMMENT ON INDEX messages_text_gin_idx IS 'GIN index for fast case-insensitive text search on message content';
COMMENT ON INDEX messages_media_caption_gin_idx IS 'GIN index for fast case-insensitive text search on media captions';
COMMENT ON INDEX messages_chat_starred_idx IS 'Composite index for starred message searches';
COMMENT ON INDEX contacts_name_gin_idx IS 'GIN index for fast case-insensitive text search on contact names';
COMMENT ON INDEX contacts_phone_gin_idx IS 'GIN index for fast case-insensitive text search on contact phone numbers';
COMMENT ON INDEX contacts_push_name_gin_idx IS 'GIN index for fast case-insensitive text search on contact push names';
COMMENT ON INDEX contacts_notes_gin_idx IS 'GIN index for fast case-insensitive text search on contact notes';
