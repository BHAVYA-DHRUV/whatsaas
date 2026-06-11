import PusherServer from 'pusher';
import { getPublisherConnection } from '@/lib/redis/connection-manager';

type PusherLike = {
  trigger: (channel: string, event: string, data: unknown) => Promise<unknown>;
};


async function invalidateTeamCacheFromChannel(channel: string, event: string) {
  if (event !== 'new-message' && event !== 'chat-list-update' && event !== 'message-update' && event !== 'message-delete') return;
  const match = /^team[-:](\d+)$/.exec(channel);
  if (!match) return;
  const { cacheInvalidateTeam } = await import('@/lib/cache/redis-cache');
  void cacheInvalidateTeam(Number(match[1]));
}

const noopPusher: PusherLike = {
  trigger: async (channel, event, data) => {
    const pub = getPublisherConnection();
    if (pub) {
      try {
        await pub.publish('whats-saas-realtime', JSON.stringify({ room: channel, event, data }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'unknown';
        console.error('[pusher-server] Redis publish error:', msg);
      }
    }
    await invalidateTeamCacheFromChannel(channel, event);
  },
};

function isPusherConfigured(): boolean {
  const key = (process.env.NEXT_PUBLIC_PUSHER_KEY || '').trim();
  const secret = (process.env.PUSHER_SECRET || '').trim();
  const appId = (process.env.PUSHER_APP_ID || '').trim();
  const cluster = (process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '').trim();

  return Boolean(appId && secret && key && cluster) &&
    !/^(demo|local|placeholder|changeme)$/i.test(key) &&
    !/^(demo|local|placeholder|changeme)$/i.test(secret);
}

function createPusher(): PusherLike {
  const hasPusher = isPusherConfigured();

  if (!hasPusher) {
    return noopPusher;
  }

  const pusher = new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    useTLS: true,
  });

  return {
    trigger: async (channel, event, data) => {
      // Retry a couple of times for transient failures
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await pusher.trigger(channel, event, data);
          break;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'unknown';
          console.error(`[pusher-server] Pusher trigger failed (attempt ${attempt + 1}):`, msg);
          if (attempt === 2) {
            // last attempt failed, continue to next steps
            break;
          }
          await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
        }
      }

      const pub = getPublisherConnection();
      if (pub) {
        try {
          await pub.publish('whats-saas-realtime', JSON.stringify({ room: channel, event, data }));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'unknown';
          console.error('[pusher-server] Redis publish error:', msg);
        }
      }

      await invalidateTeamCacheFromChannel(channel, event);
    },
  };
}

export const pusherServer = createPusher();
