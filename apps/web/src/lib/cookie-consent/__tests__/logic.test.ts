import { describe, it, expect } from 'vitest';
import {
  isStale,
  createConsentId,
  CONSENT_STALE_AFTER_MS,
} from '@/lib/cookie-consent/logic';

describe('isStale', () => {
  const NOW = 1_700_000_000_000;

  it('is not stale when never consented (null)', () => {
    expect(isStale(null, NOW)).toBe(false);
  });

  it('is not stale immediately after consenting', () => {
    expect(isStale(NOW, NOW)).toBe(false);
  });

  it('is not stale just before the 6-month window closes', () => {
    const consentedAt = NOW - (CONSENT_STALE_AFTER_MS - 1);
    expect(isStale(consentedAt, NOW)).toBe(false);
  });

  it('is not stale exactly at the boundary', () => {
    // isStale uses strict `>`, so exactly-at-window is still fresh.
    const consentedAt = NOW - CONSENT_STALE_AFTER_MS;
    expect(isStale(consentedAt, NOW)).toBe(false);
  });

  it('is stale one millisecond past the window', () => {
    const consentedAt = NOW - (CONSENT_STALE_AFTER_MS + 1);
    expect(isStale(consentedAt, NOW)).toBe(true);
  });

  it('is stale well past the window', () => {
    const consentedAt = NOW - CONSENT_STALE_AFTER_MS * 2;
    expect(isStale(consentedAt, NOW)).toBe(true);
  });
});

describe('createConsentId', () => {
  it('returns a valid UUID', () => {
    const id = createConsentId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('returns a distinct id on each call', () => {
    expect(createConsentId()).not.toBe(createConsentId());
  });
});