const isDev = import.meta.env.DEV;


const createLogger = (module: string) => ({
    debug: (msg: string, ctx?: Record<string, unknown>) => {
        if (isDev) console.debug(`[${module}]`, msg, ctx);
      },
      info: (msg: string, ctx?: Record<string, unknown>) => {
        console.info(`[${module}]`, msg, ctx);
      },
      warn: (msg: string, ctx?: Record<string, unknown>) => {
        console.warn(`[${module}]`, msg, ctx);
        // TODO Sentry: Sentry.captureMessage(msg, { level: 'warning', extra: ctx });
      },
      error: (msg: string, ctx?: Record<string, unknown>) => {
        console.error(`[${module}]`, msg, ctx);
        // TODO Sentry: Sentry.captureException(ctx?.err ?? new Error(msg), { extra: ctx });
      },
});

export const authLogger = createLogger('auth');
export const apiLogger = createLogger('api');
export const routeLogger = createLogger('router');
export const networkLogger = createLogger('network');