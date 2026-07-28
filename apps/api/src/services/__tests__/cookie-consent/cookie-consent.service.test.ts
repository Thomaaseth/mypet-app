import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { CookieConsentService } from '../../cookie-consent.service';
import { db } from '../../../db';
import { cookieConsentLog } from '../../../db/schema/cookie-consent-log';
import { DatabaseTestUtils } from '../../../test/database-test-utils';
import { makeCookieConsentLogInput } from './factories';
import { BadRequestError } from '@/middleware/errors';

async function getLogRowsFor(consentId: string) {
  return db.select().from(cookieConsentLog).where(eq(cookieConsentLog.consentId, consentId));
}

describe('CookieConsentService.logConsent', () => {
  it('inserts a row with the given choices, ip, and user agent', async () => {
    const input = makeCookieConsentLogInput({
      consentId: 'a1111111-1111-1111-1111-111111111111',
      choices: { necessary: true, analytics: true },
    });

    await CookieConsentService.logConsent(input, {
      userId: null,
      ipAddress: '203.0.113.5',
      userAgent: 'test-agent/1.0',
    });

    const rows = await getLogRowsFor(input.consentId);
    expect(rows).toHaveLength(1);
    expect(rows[0].choices).toEqual({ necessary: true, analytics: true });
    expect(rows[0].ipAddress).toBe('203.0.113.5');
    expect(rows[0].userAgent).toBe('test-agent/1.0');
  });

  it('stores userId as null for anonymous visitors, rather than requiring one', async () => {
    const input = makeCookieConsentLogInput({
      consentId: 'a2222222-2222-2222-2222-222222222222',
    });

    await CookieConsentService.logConsent(input, {
      userId: null,
      ipAddress: null,
      userAgent: null,
    });

    const [row] = await getLogRowsFor(input.consentId);
    expect(row.userId).toBeNull();
  });

  it('attaches userId when the visitor is logged in', async () => {
    const { primary } = await DatabaseTestUtils.createTestUsers();
    const input = makeCookieConsentLogInput({
      consentId: 'a3333333-3333-3333-3333-333333333333',
    });

    await CookieConsentService.logConsent(input, {
      userId: primary.id,
      ipAddress: null,
      userAgent: null,
    });

    const [row] = await getLogRowsFor(input.consentId);
    expect(row.userId).toBe(primary.id);
  });

  it('inserts a new row on every call rather than updating a prior one — the history itself is the audit trail', async () => {
    const consentId = 'a4444444-4444-4444-4444-444444444444';

    await CookieConsentService.logConsent(
      makeCookieConsentLogInput({ consentId, choices: { necessary: true, analytics: false } }),
      { userId: null, ipAddress: null, userAgent: null }
    );
    await CookieConsentService.logConsent(
      makeCookieConsentLogInput({ consentId, choices: { necessary: true, analytics: true } }),
      { userId: null, ipAddress: null, userAgent: null }
    );

    const rows = await getLogRowsFor(consentId);
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.choices.analytics).sort()).toEqual([false, true]);
  });

  it('wraps a DB-level failure (e.g. FK violation from a non-existent userId) as a BadRequestError', async () => {
    const input = makeCookieConsentLogInput({
      consentId: 'a5555555-5555-5555-5555-555555555555',
    });

    await expect(
      CookieConsentService.logConsent(input, {
        userId: 'user-that-does-not-exist',
        ipAddress: null,
        userAgent: null,
      })
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});