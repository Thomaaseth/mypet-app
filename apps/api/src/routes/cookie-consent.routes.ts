import { Router, Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { CookieConsentService } from '../services/cookie-consent.service';
import { BadRequestError } from '../middleware/errors';
import { respondWithSuccess } from '../lib/json';
import { cookieConsentLogSchema } from '@/shared/validations/cookie-consent';
import { authLogger } from '../lib/logger';

const router = Router();

// Best-effort session lookup: attaches userId when the visitor happens to be
// logged in, but never requires it: consent must be loggable before login,
// during sign-up, or anonymously
// Never block the consent log itself from being written.
async function tryGetUserId(req: Request): Promise<string | null> {
  try {
    const sessionResult = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    return sessionResult?.user?.id ?? null;
  } catch (error) {
    authLogger.warn({ err: error }, 'Best-effort session lookup failed for cookie consent log');
    return null;
  }
}

// POST /api/cookie-consent
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = cookieConsentLogSchema.safeParse(req.body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new BadRequestError(`Validation error: ${firstError.message}`);
    }

    const userId = await tryGetUserId(req);

    await CookieConsentService.logConsent(validation.data, {
      userId,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    respondWithSuccess(res, {}, 'Cookie consent logged successfully');
  } catch (error) {
    next(error);
  }
});

export default router;