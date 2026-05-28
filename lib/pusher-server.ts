import PusherServer from 'pusher';
import IORedis from 'ioredis';

type PusherLike = {
  trigger: (channel: string, event: string, data: unknown) => Promise<unknown>;
};

let redisPublisher: IORedis | null = null;

function getRedisPublisher(): IORedis | null {
  if (redisPublisher !== null) return redisPublisher;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redisPublisher = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    return redisPublisher;
  } catch (err: any) {
    console.error('[pusher-server] Failed to connect to Redis publisher:', err.message);
    return null;
  }
}

async function invalidateTeamCacheFromChannel(channel: string, event: string) {
  if (event !== 'new-message' && event !== 'chat-list-update') return;
  const match = /^team-(\d+)$/.exec(channel);
  if (!match) return;
  const { cacheInvalidateTeam } = await import('@/lib/cache/redis-cache');
  void cacheInvalidateTeam(Number(match[1]));
}

const noopPusher: PusherLike = {
  trigger: async (channel, event, data) => {
    const pub = getRedisPublisher();
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

function createPusher(): PusherLike {
  const hasPusher = Boolean(
    process.env.PUSHER_APP_ID &&
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.PUSHER_SECRET
  );

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
      try {
        await pusher.trigger(channel, event, data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'unknown';
        console.error('[pusher-server] Pusher trigger failed:', msg);
      }

      const pub = getRedisPublisher();
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
