-- Performance indexes (idempotent)
CREATE INDEX IF NOT EXISTS "messages_chat_id_timestamp_idx" ON "messages" ("chat_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "messages_chat_id_idx" ON "messages" ("chat_id");
CREATE INDEX IF NOT EXISTS "chats_team_id_idx" ON "chats" ("team_id");
CREATE INDEX IF NOT EXISTS "chats_team_id_last_message_timestamp_idx" ON "chats" ("team_id", "last_message_timestamp" DESC);
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" ("user_id");
CREATE INDEX IF NOT EXISTS "teams_stripe_customer_id_idx" ON "teams" ("stripe_customer_id") WHERE "stripe_customer_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "teams_gateway_subscription_id_idx" ON "teams" ("gateway_subscription_id") WHERE "gateway_subscription_id" IS NOT NULL;
