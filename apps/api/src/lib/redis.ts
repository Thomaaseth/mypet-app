import { Redis } from 'ioredis';
import { logger } from '../lib/logger';

// Redis client only instantiated when REDIS_URL is set (production)
// in dev all limiters fall back to in-memory store automatically
export const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      // Fail fast
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    })
  : null;

// Track state so we log transitions, not every retry event
let rateLimitProtected = redisClient ? false : true; // no Redis in dev = intentional, treat as fine

if (redisClient) {
  redisClient.on('error', (err: Error) => {
    // Only log the transition INTO the unprotected state, once.
    if (rateLimitProtected) {
      rateLimitProtected = false;
      logger.error(
        { err },
        'Redis unavailable, rate limiting AND email quotas are now FAILING OPEN (not enforced).'      );
    }
  });

  redisClient.on('ready', () => {
    // Log recovery so you can confirm protection is restored.
    if (!rateLimitProtected) {
      logger.info('Redis reconnected, rate limiting and email quota protection restored.');    }
    rateLimitProtected = true;
  });
}
