ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" timestamp;
--> statement-breakpoint
UPDATE "teams" SET "onboarding_completed_at" = NOW() WHERE "onboarding_completed_at" IS NULL;
