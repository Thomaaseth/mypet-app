import type { CookieConsentLogInput } from '@/shared/validations/cookie-consent';

export function makeCookieConsentLogInput(
  overrides: Partial<CookieConsentLogInput> = {}
): CookieConsentLogInput {
  return {
    consentId: '123e4567-e89b-12d3-a456-426614174000',
    choices: { necessary: true, analytics: false },
    ...overrides,
  };
}