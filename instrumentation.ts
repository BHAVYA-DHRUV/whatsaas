process.env.TZ = 'UTC';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env');
    const { validateRateLimitConfig } = await import('@/lib/rate-limit');
    try {
      validateEnv();
      validateRateLimitConfig();
    } catch (e) {
      console.error('[instrumentation] env validation failed', e);
    }

    const shutdown = async (signal: string) => {
      console.log(`[shutdown] ${signal} received`);
      try {
        const { getRedis } = await import('@/lib/redis');
        const redis = getRedis();
        if (redis) await redis.quit();
      } catch {
        /* ignore */
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  }
}
