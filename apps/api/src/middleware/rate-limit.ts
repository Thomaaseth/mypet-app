import rateLimit from 'express-rate-limit';

// strict rate limit for auth endpoints
// 10 req per 15 min per IP

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Too many authentication attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false, 
})

// general rate limiter for all other API endpoints
// 200 req per 15 min per IP
// use in-memory store => scale with rate-limit-redis if necessary (share counter accross instances)
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    // no rate limit on health checks endpoints
    skip: (req) => {
        return req.path === '/api/health' || req.path === '/api/ready';
    }
})