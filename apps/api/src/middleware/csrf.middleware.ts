import type { Request, Response, NextFunction } from 'express';
import { respondWithError } from '../lib/json';
import { logger } from '../lib/logger';

// Origin validation middleware for multipart/form-data endpoints.
// Applied only to the image upload endpoint, other endpoints require application/json 
// which triggers a CORS preflight

export function csrfOriginGuard(allowedOrigin: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    // no origin = non browser client => allowed
    if (!origin) {
      return next();
    }

    if (origin !== allowedOrigin) {
      logger.warn(
        { origin, allowedOrigin, url: req.originalUrl },
        'CSRF origin check failed — request blocked'
      );
      respondWithError(res, 403, 'Forbidden');
      return;
    }

    next();
  };
}