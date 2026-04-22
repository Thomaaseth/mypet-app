import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { respondWithError } from '../lib/json';
import { APIError } from 'better-auth/api';
import { authLogger } from '../lib/logger';


// export interface AuthenticatedRequest extends Request {
//     authSession?: {
//       user: {
//         id: string;
//         email: string;
//         name: string;
//         emailVerified: boolean;
//         role: string,
//         banned: boolean | null,
//         createdAt: Date;
//         updatedAt: Date;
//         image?: string | null;
//       };
//       session: {
//         id: string;
//         userId: string;
//         expiresAt: Date;
//         token: string;
//         createdAt: Date;
//         updatedAt: Date;
//         ipAddress?: string | null;
//         userAgent?: string | null;
//       };
//     };
//   }

// Derive session type directly from better-auth 
type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

type AuthUser = NonNullable<BetterAuthSession>['user'];
type AuthSession = NonNullable<BetterAuthSession>['session'];

export interface AuthenticatedRequest extends Request {
    authSession?: {
        user: AuthUser;
        session: AuthSession;
    }
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
    
    authLogger.error({ err: error }, 'Global auth middleware error');

    if (error instanceof APIError) {
        respondWithError(res, error.statusCode || 401, error.message);
        return;
    }
    
    respondWithError(res, 401, 'Authentication failed');
    }
}

// Admin-only middleware requires role === 'admin'
export async function adminAuthHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sessionResult = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
  
      if (!sessionResult?.session || !sessionResult?.user) {
        respondWithError(res, 401, 'Authentication required');
        return;
      }
  
      if (sessionResult.user.role !== 'admin') {
        authLogger.warn(
          { userId: sessionResult.user.id, role: sessionResult.user.role },
          'Admin route access denied — insufficient role'
        );
        respondWithError(res, 403, 'Forbidden');
        return;
      }
  
      (req as AuthenticatedRequest).authSession = {
        user: sessionResult.user,
        session: sessionResult.session,
      };
  
      next();
    } catch (error: unknown) {
      authLogger.error({ err: error }, 'Admin auth middleware error');
  
      if (error instanceof APIError) {
        respondWithError(res, error.statusCode || 401, error.message);
        return;
      }
  
      respondWithError(res, 401, 'Authentication failed');
    }
  }