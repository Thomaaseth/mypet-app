// Pure cookie-consent logic, extracted so it can be unit tested in isolation
// (the context consumes these)

// CNIL re-prompt cadence for the banner
export const CONSENT_STALE_AFTER_MS = 1000 * 60 * 60 * 24 * 30 * 6; // ~6 months

export function createConsentId(): string {
  return crypto.randomUUID();
}

// `now` is injectable purely so tests can pin time without mocking Date.
// Production callers omit it and get Date.now().
export function isStale(consentedAt: number | null, now: number = Date.now()): boolean {
  if (consentedAt === null) return false;
  return now - consentedAt > CONSENT_STALE_AFTER_MS;
}