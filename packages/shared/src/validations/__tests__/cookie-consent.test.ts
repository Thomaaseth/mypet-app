import { describe, it, expect } from 'vitest';
import { cookieConsentLogSchema, cookieConsentChoicesSchema } from '../cookie-consent';
import { expectRejectsUnknownKey } from './_helpers';

describe('cookieConsentLogSchema', () => {
  it('accepts a valid payload', () => {
    const result = cookieConsentLogSchema.safeParse({
      consentId: '123e4567-e89b-12d3-a456-426614174000',
      choices: { necessary: true, analytics: true },
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID consentId', () => {
    const result = cookieConsentLogSchema.safeParse({
      consentId: 'not-a-uuid',
      choices: { necessary: true, analytics: false },
    });

    expect(result.success).toBe(false);
  });

  it('rejects necessary: false — it is not a real user choice, only true is valid', () => {
    const result = cookieConsentLogSchema.safeParse({
      consentId: '123e4567-e89b-12d3-a456-426614174000',
      choices: { necessary: false, analytics: false },
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing analytics field', () => {
    const result = cookieConsentLogSchema.safeParse({
      consentId: '123e4567-e89b-12d3-a456-426614174000',
      choices: { necessary: true },
    });

    expect(result.success).toBe(false);
  });

  it('rejects analytics as a non-boolean', () => {
    const result = cookieConsentLogSchema.safeParse({
      consentId: '123e4567-e89b-12d3-a456-426614174000',
      choices: { necessary: true, analytics: 'yes' },
    });

    expect(result.success).toBe(false);
  });

  it('cookieConsentLogSchema rejects unknown keys (strict)', () =>
  expectRejectsUnknownKey(cookieConsentLogSchema, { consentId: '123e4567-e89b-12d3-a456-426614174000', choices: { necessary: true, analytics: true } }));

  it('cookieConsentChoicesSchema rejects unknown keys (strict)', () =>
  expectRejectsUnknownKey(cookieConsentChoicesSchema, { necessary: true, analytics: true }));
});