ALTER TABLE "plans" ALTER COLUMN "max_users" SET DEFAULT -1;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "max_contacts" SET DEFAULT -1;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "max_instances" SET DEFAULT -1;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "is_ai_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "is_flow_builder_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "is_campaigns_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "is_templates_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "is_voice_calls_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "pinned_at" timestamp;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "bio" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "status" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "last_seen" timestamp;--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "profile_name" text;--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "profile_picture_url" text;--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "connected_at" timestamp;--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "last_seen" timestamp;--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "messages_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "connection_type" varchar(50);--> statement-breakpoint
ALTER TABLE "evolution_instances" ADD COLUMN IF NOT EXISTS "created_by" integer;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evolution_instances_created_by_users_id_fk'
  ) THEN
    ALTER TABLE "evolution_instances" ADD CONSTRAINT "evolution_instances_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_team_id_idx" ON "chats" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_team_id_last_message_timestamp_idx" ON "chats" USING btree ("team_id","last_message_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_instance_id_idx" ON "chats" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_remote_jid_idx" ON "chats" USING btree ("remote_jid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_is_pinned_idx" ON "chats" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chats_is_archived_idx" ON "chats" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_conversations_workspace_id" ON "chats" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_assigned_user_id_idx" ON "contacts" USING btree ("assigned_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_funnel_stage_id_idx" ON "contacts" USING btree ("funnel_stage_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_workspace_id" ON "contacts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instance_integration_idx" ON "evolution_instances" USING btree ("integration");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_instances_workspace_id" ON "evolution_instances" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_chat_id_timestamp_idx" ON "messages" USING btree ("chat_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_chat_id_idx" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_timestamp_idx" ON "messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_chat_id" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_team_members_user_id" ON "team_members" USING btree ("user_id");