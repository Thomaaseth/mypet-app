import { db } from '../db';
import { cookieConsentLog } from '../db/schema/cookie-consent-log';
import type { NewCookieConsentLogEntry } from '../db/schema/cookie-consent-log';
import type { CookieConsentLogInput } from '@/shared/validations/cookie-consent';
import { BadRequestError } from '../middleware/errors';
import { dbLogger } from '../lib/logger';

interface LogConsentContext {
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export class CookieConsentService {
  // Always inserts, never updates a prior row. Each accept/reject/change
  // is its own immutable audit entry
  static async logConsent(
    input: CookieConsentLogInput,
    context: LogConsentContext
  ): Promise<void> {
    try {
      const newEntry: NewCookieConsentLogEntry = {
        consentId: input.consentId,
        choices: input.choices,
        userId: context.userId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      };

      await db.insert(cookieConsentLog).values(newEntry);
    } catch (error) {
      dbLogger.error({ err: error }, 'Error logging cookie consent');
      throw new BadRequestError('Failed to log cookie consent');
    }
  }
}