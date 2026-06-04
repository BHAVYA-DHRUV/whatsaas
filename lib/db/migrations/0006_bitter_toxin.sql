ALTER TABLE "contacts" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "push_name" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "profile_picture" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "instance_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "remote_jid" text;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_instance_id_evolution_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."evolution_instances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_phone_idx" ON "contacts" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "messages_instance_id_idx" ON "messages" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "messages_remote_jid_idx" ON "messages" USING btree ("remote_jid");