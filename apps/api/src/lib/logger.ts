import pino from 'pino';

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
  
  // Add base context
  base: {
    env: process.env.NODE_ENV,
  },
});

// Domain-specific child loggers
export const dbLogger = logger.child({ module: 'database' });
export const authLogger = logger.child({ module: 'auth' });
export const httpLogger = logger.child({ module: 'http' });
export const serverLogger = logger.child({ module: 'server' });
