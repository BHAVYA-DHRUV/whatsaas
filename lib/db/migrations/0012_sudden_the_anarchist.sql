CREATE INDEX "chats_name_gin_idx" ON "chats" USING gin ("name");--> statement-breakpoint
CREATE INDEX "chats_push_name_gin_idx" ON "chats" USING gin ("push_name");--> statement-breakpoint
CREATE INDEX "chats_last_message_text_gin_idx" ON "chats" USING gin ("last_message_text");--> statement-breakpoint
CREATE INDEX "chats_remote_jid_gin_idx" ON "chats" USING gin ("remote_jid");--> statement-breakpoint
CREATE INDEX "chats_team_archived_pinned_idx" ON "chats" USING btree ("team_id","is_archived","is_pinned");--> statement-breakpoint
CREATE INDEX "chats_team_unread_idx" ON "chats" USING btree ("team_id","unread_count");--> statement-breakpoint
CREATE INDEX "contacts_name_gin_idx" ON "contacts" USING gin ("name");--> statement-breakpoint
CREATE INDEX "contacts_phone_gin_idx" ON "contacts" USING gin ("phone");--> statement-breakpoint
CREATE INDEX "contacts_push_name_gin_idx" ON "contacts" USING gin ("push_name");--> statement-breakpoint
CREATE INDEX "contacts_notes_gin_idx" ON "contacts" USING gin ("notes");--> statement-breakpoint
CREATE INDEX "messages_text_gin_idx" ON "messages" USING gin ("text");--> statement-breakpoint
CREATE INDEX "messages_media_caption_gin_idx" ON "messages" USING gin ("media_caption");--> statement-breakpoint
CREATE INDEX "messages_chat_starred_idx" ON "messages" USING btree ("chat_id","is_starred");