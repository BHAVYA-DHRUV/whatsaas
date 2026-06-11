-- Drop duplicate indexes on team_members
DROP INDEX IF EXISTS "idx_team_members_user_id";

-- Drop duplicate indexes on chats
DROP INDEX IF EXISTS "idx_conversations_workspace_id";

-- Drop duplicate indexes on messages
DROP INDEX IF EXISTS "idx_messages_chat_id";
DROP INDEX IF EXISTS "idx_messages_created_at";

-- Drop duplicate indexes on contacts
DROP INDEX IF EXISTS "idx_contacts_workspace_id";
