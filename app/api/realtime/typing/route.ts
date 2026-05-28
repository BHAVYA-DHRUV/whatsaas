import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import { assertChatBelongsToTeam } from '@/lib/auth/tenant';
import { isApiTeamContext, requireApiTeam, toApiErrorResponse } from '@/lib/api/tenant-api';
import { pusherServer } from '@/lib/pusher-server';
import { RealtimeEvents } from '@/lib/realtime/events';

const bodySchema = z.object({
  chatId: z.number().int().positive(),
  remoteJid: z.string().min(1),
  isTyping: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const teamCtx = await requireApiTeam();
    if (!isApiTeamContext(teamCtx)) return teamCtx;
    const { team } = teamCtx;

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { chatId, remoteJid, isTyping } = parsed.data;
    await assertChatBelongsToTeam(chatId, team.id);

    await pusherServer.trigger(`team-${team.id}`, RealtimeEvents.TYPING, {
      chatId,
      remoteJid,
      userId: user.id,
      userName: user.name || user.email,
      isTyping,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return toApiErrorResponse(e, 'typing');
  }
}
