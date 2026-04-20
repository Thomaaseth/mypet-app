import type { Request, Response } from 'express';
import { db } from '../db';
import { respondWithJSON, respondWithError } from '../lib/json';

export async function healthCheck(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    await db.execute('SELECT 1');
    const responseTime = Date.now() - startTime;

    const isProd = process.env.NODE_ENV === 'production';

    const healthData = isProd
      ? { status: 'ok' }
      : {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          responseTime: `${responseTime}ms`,
          database: 'connected',
        };

    respondWithJSON(res, 200, healthData);
  } catch {
    respondWithError(res, 503, 'Service unavailable');
  }
}

export async function readinessCheck(req: Request, res: Response) {
  try {
    await db.execute('SELECT 1');

    const isProd = process.env.NODE_ENV === 'production';

    const readiness = isProd
      ? { status: 'ok' }
      : {
          status: 'ok',
          timestamp: new Date().toISOString(),
          services: {
            database: 'ready',
            auth: 'ready',
          },
        };

    respondWithJSON(res, 200, readiness);
  } catch {
    respondWithError(res, 503, 'Service unavailable');
  }
}
