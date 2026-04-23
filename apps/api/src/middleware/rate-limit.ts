import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Redis } from 'ioredis';
import type { Request } from 'express';
import type { AuthenticatedRequest } from './auth.middleware';
import { logger } from '../lib/logger';

// Redis client only instantiated when REDIS_URL is set (production)
// in dev all limiters fall back to in-memory store automatically
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      // Fail fast
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
  : null;

// returns a RedisStore if Redis is available, undefined otherwise
// undefined = express-rate-limit uses its default in-memory store
redisClient?.on('error', (err: Error) => {
  // Log but don't crash — if Redis dies, express-rate-limit falls back gracefully
  logger.error({ err }, 'Redis connection error');
});

function makeStore(prefix: string): RedisStore | undefined {
    if (!redisClient) return undefined;
  
    return new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (...args: [string, ...string[]]) => redisClient.call(...args) as Promise<number>,
    });
  }

// IP extractor reads the real client IP respecting trust proxy setting
// Express sets req.ip correctly once trust proxy is configured in app.ts
function getClientIp(req: Request): string {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    return ipKeyGenerator(ip);
}

// strict rate limit for auth endpoints
// 10 req per 15 min per IP
// protects sign-in, sign-up, password reset
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    keyGenerator: getClientIp,
    store: makeStore('auth'),
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false, 
});

// general IP limiter
// Applied globally in app.ts BEFORE auth
// 200 req per 15 min per IP
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    keyGenerator: getClientIp,
    store: makeStore('general'),
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// per-user limiter 
// Applied AFTER globalAuthHandler so req.authSession is guaranteed to exist
// 200 requests per 15 min per userId
export const userRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    keyGenerator: (req: Request): string => {
      const userId = (req as AuthenticatedRequest).authSession?.user.id;
      // Fallback to IP if userId somehow missing, should never happen 
      return userId ?? ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown');
    },
    store: makeStore('user'),
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// health check rate limiter
// 10 req per minute per IP
export const healthRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    keyGenerator: getClientIp,
    store: makeStore('health'),
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

