// `necessary` is always true and is not user-toggleable (session/auth cookie only)
export interface CookieConsent {
  necessary: true;
  analytics: boolean;
}

// distinguish "user has decided" vs "user has not decided"
export interface CookieConsentState {
  consent: CookieConsent;
  hasConsented: boolean;
  // crypto.randomUUID() generated once per browser, persisted alongside the
  // choice. Used to correlate this browser's consent events server-side
  // (audit log) without requiring an account
  consentId: string;
  // Tracked consent time so it's treated as stale after 6months (CNIL best practice)
  consentedAt: number | null;
}