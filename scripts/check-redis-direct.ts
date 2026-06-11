import 'dotenv/config';
import Redis from 'ioredis';

async function main() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log('Connecting to Redis at:', url);
  const redis = new Redis(url);

  try {
    const keys = await redis.keys('*');
    console.log('All keys in Redis:', keys);
    const rlKeys = keys.filter(k => k.startsWith('rl:'));
    console.log('Rate limit keys in Redis:', rlKeys);
    for (const key of rlKeys) {
      const val = await redis.get(key);
      const ttl = await redis.ttl(key);
      console.log(`Key: ${key}, Value: ${val}, TTL: ${ttl}s`);
    }

    if (rlKeys.length > 0) {
      console.log('Deleting all rate limit keys to clear rate limit block...');
      const deleted = await redis.del(...rlKeys);
      console.log(`Deleted ${deleted} keys.`);
    }
  } catch (error) {
    console.error('Error querying Redis:', error instanceof Error ? error.message : String(error));
  } finally {
    redis.disconnect();
  }
}

main().catch(console.error);
