import { z } from 'zod';

export const listChatsQuerySchema = z.object({
  scope: z.enum(['kanban', 'archived', 'unread', 'pinned', 'all']).optional(),
});

export type ListChatsQuery = z.infer<typeof listChatsQuerySchema>;

