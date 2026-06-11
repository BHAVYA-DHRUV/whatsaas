ALTER TABLE "contacts" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "contacts_deleted_at_idx" ON "contacts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "messages_deleted_at_idx" ON "messages" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_message_id_unique" UNIQUE("id");