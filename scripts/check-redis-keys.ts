import 'dotenv/config';
import { getRedis } from '../lib/redis';

async function main() {
  const redis = getRedis();
  if (!redis) {
    console.log('Redis is not enabled or configured.');
    return;
  }

  try {
    const keys = await redis.keys('rl:*');
    console.log('Rate limit keys in Redis:', keys);
    for (const key of keys) {
      const val = await redis.get(key);
      const ttl = await redis.ttl(key);
      console.log(`Key: ${key}, Value: ${val}, TTL: ${ttl}s`);
    }
  } catch (error) {
    console.error('Error querying Redis:', error instanceof Error ? error.message : String(error));
  } finally {
    if (redis && 'disconnect' in redis) {
      (redis as any).disconnect();
    }
  }
}

main().catch(console.error);
