ALTER TABLE "messages" ADD COLUMN "is_starred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_edited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "messages_is_starred_idx" ON "messages" USING btree ("is_starred");