// Pure, framework-free install-detection logic
export const INSTALL_SNOOZE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// iOS Safari exposes a non-standard `navigator.standalone`
type SafariNavigator = Navigator & { standalone?: boolean };

export function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as SafariNavigator).standalone === true;
  return displayModeStandalone || iosStandalone;
}

export function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIPhoneOrIPod = /iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "Macintosh"; a touch-capable Mac is treated as iOS.
  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return isIPhoneOrIPod || isIPad;
}

// `now` is injectable purely so tests can pin time without mocking Date.
// Production callers omit it and get Date.now().
export function isSnoozed(dismissedAt: number | null, now: number = Date.now()): boolean {
  if (dismissedAt === null) return false;
  return now - dismissedAt < INSTALL_SNOOZE_MS;
}