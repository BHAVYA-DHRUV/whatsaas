-- Add isArchived, isPinned, pinnedAt, and deletedAt columns to chats table
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "is_pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "is_archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "pinned_at" TIMESTAMP;
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS "chats_is_pinned_idx" ON "chats"("is_pinned");
CREATE INDEX IF NOT EXISTS "chats_is_archived_idx" ON "chats"("is_archived");
