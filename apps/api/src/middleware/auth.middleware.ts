import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { respondWithError } from '../lib/json';
import { extractErrorDetails } from '../types/betterAuthErrors';
import { session } from '@/db';


export interface AuthenticatedRequest extends Request {
    authSession?: {
      user: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        image?: string | null;
      };
      session: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
      };
    };
  }

const PUBLIC_ROUTES = [
    '/api/auth',
    '/api/health',
    '/api/ready',
];

const isPublicRoute = (path: string): boolean => {
    return PUBLIC_ROUTES.some(route => path.startsWith(route));
};

export async function globalAuthHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (isPublicRoute(req.path)) {
        return next();
    }

    try {
        const sessionResult = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!sessionResult || !sessionResult.session || !sessionResult.user) {
            respondWithError(res, 401, 'Authentication required');
            return;
        }

        (req as AuthenticatedRequest).authSession  = {
            user: sessionResult.user,
            session: sessionResult.session,
        };
        
        next();
    } catch (error: unknown) {
        console.error('Global auth middleware error', error);
        const { statusCode, message } = extractErrorDetails(error);
        respondWithError(res, statusCode || 401, message || 'Authentication failed')
    }
}
