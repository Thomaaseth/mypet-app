import type { Request, Response } from 'express';
import { db } from '../db';
import { respondWithJSON, respondWithError } from '../lib/json';

export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    await db.execute('SELECT 1');
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: 'connected'
    };
    
    respondWithJSON(res, 200, healthData);
  } catch (error) {
    respondWithError(res, 503, 'Database connection failed');
  }
}

export async function readinessCheck(req: Request, res: Response) {
    try {
        await db.execute('SELECT 1');
        
        const readiness = {
            status: 'ready',
            timestamp: new Date().toISOString(),
            services: {
              database: 'ready',
              auth: 'ready'
            }
        };

      respondWithJSON(res, 200, readiness);
    } catch (error) {
      respondWithError(res, 503, 'Database not ready');
    };
}
