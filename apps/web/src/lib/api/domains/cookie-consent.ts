import { makeApiRequest } from '@/lib/api/core';
import type { CookieConsentLogInput } from '@/shared/validations/cookie-consent';

// uses makeApiRequest (unauthenticated) rather than the
// authenticated `post` helper used by other domains: this endpoint is public
// by design (anonymous visitors must be able to log consent before ever
// signing in)
export async function logCookieConsent(data: CookieConsentLogInput): Promise<void> {
  await makeApiRequest('/api/cookie-consent', {
    method: 'POST',
    body: data,
  });
}