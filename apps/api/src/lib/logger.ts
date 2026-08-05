import pino from 'pino';
import { APP_ENV } from '../config/app-env';

// Strip the query string from any logged URL
function stripUrlQuery(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const queryStart = value.indexOf('?');
  return queryStart === -1 ? value : value.slice(0, queryStart);
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,

  // Redact secrets if they ever reach a log object.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      '*.password',
      'token',
      '*.token',
      'secret',
      '*.secret',
      'apiKey',
      '*.apiKey',
      // Uncomment after launch to redact PII (visible during beta for
      // user tracing):
      // 'email',
      // '*.email',
    ],
    censor: '[Redacted]',
  },

  serializers: {
    // Keep pino's standard error serializer (type/message/stack).
    err: pino.stdSerializers.err,
    // Scrub query strings (and their tokens) from any logged URL.
    url: stripUrlQuery,
  },
  
  base: {
    env: process.env.NODE_ENV, // runtime mode: development | production | test
    app_env: APP_ENV,          // deployment identity: distinguishes staging vs prod
  },
});

// Domain-specific child loggers
export const dbLogger = logger.child({ module: 'database' });
export const authLogger = logger.child({ module: 'auth' });
export const httpLogger = logger.child({ module: 'http' });
export const serverLogger = logger.child({ module: 'server' });
