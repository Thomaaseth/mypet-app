import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { Request } from 'express';
import type { AuthenticatedRequest } from './auth.middleware';
import { redisClient } from '@/lib/redis';

function makeStore(prefix: string): RedisStore | undefined {
    const client = redisClient;
    if (!client) return undefined;

    return new RedisStore({
      prefix: `rl:${prefix}:`,
      // `client` is a local const, so TS proves it stays non-null inside the
      // closure — narrowing an imported binding doesn't survive into the arrow.
      sendCommand: (...args: [string, ...string[]]) => client.call(...args) as Promise<number>,
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

// email-triggering endpoints (verification resend, etc.)
// Very strict
// 3 req per 15 min per IP
export const emailRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    keyGenerator: getClientIp,
    store: makeStore('email'),
    message: { error: 'Too many email requests, please try again later.' },
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

// public unauthenticated write endpoints (e.g. cookie-consent audit log)
// Tighter than general since these hit the DB without auth.
// 20 req per 15 min per IP
export const publicWriteRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: getClientIp,
    store: makeStore('public-write'),
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

