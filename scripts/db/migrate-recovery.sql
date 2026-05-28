-- Idempotent production recovery (safe to run multiple times).
-- Fixes known drift: plans.gateway_id dropped by 0001_dusty_wild_child.

BEGIN;

ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamp;
UPDATE "teams" SET "onboarding_completed_at" = NOW() WHERE "onboarding_completed_at" IS NULL;

ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "gateway_id" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plans_gateway_id_payment_gateways_id_fk'
  ) THEN
    ALTER TABLE "plans"
      ADD CONSTRAINT "plans_gateway_id_payment_gateways_id_fk"
      FOREIGN KEY ("gateway_id") REFERENCES "public"."payment_gateways"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "messages_chat_id_timestamp_idx" ON "messages" ("chat_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "messages_chat_id_idx" ON "messages" ("chat_id");
CREATE INDEX IF NOT EXISTS "chats_team_id_idx" ON "chats" ("team_id");
CREATE INDEX IF NOT EXISTS "chats_team_id_last_message_timestamp_idx" ON "chats" ("team_id", "last_message_timestamp" DESC);
CREATE INDEX IF NOT EXISTS "chats_team_id_updated_idx" ON "chats" ("team_id", "last_message_timestamp");
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" ("user_id");

COMMIT;
