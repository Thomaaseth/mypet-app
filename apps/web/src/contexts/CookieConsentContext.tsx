import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { logCookieConsent } from '@/lib/api/domains/cookie-consent';
import { apiLogger } from '@/lib/logger';
import type { CookieConsent, CookieConsentState } from '@/types/cookie-consent';

const COOKIE_CONSENT_STORAGE_KEY = 'pettr-cookie-consent';

// CNIL best-practice re-prompt interval
const CONSENT_STALE_AFTER_MS = 1000 * 60 * 60 * 24 * 30 * 6; // ~6 months

function createConsentId(): string {
  return crypto.randomUUID();
}

const DEFAULT_STATE: CookieConsentState = {
  consent: { necessary: true, analytics: false },
  hasConsented: false,
  consentId: createConsentId(),
  consentedAt: null,
};

function isStale(consentedAt: number | null): boolean {
  if (consentedAt === null) return false;
  return Date.now() - consentedAt > CONSENT_STALE_AFTER_MS;
}


function logConsentInBackground(consentId: string, consent: CookieConsent) {
  logCookieConsent({ consentId, choices: consent }).catch((error: unknown) => {
    apiLogger.warn('Failed to write cookie consent audit log entry', { err: error });
  });
}

interface CookieConsentContextValue {
  consent: CookieConsent;
  hasConsented: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  updateConsent: (analytics: boolean) => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [state, setState] = useLocalStorage<CookieConsentState>(
    COOKIE_CONSENT_STORAGE_KEY,
    DEFAULT_STATE
  );

  const acceptAll = useCallback(() => {
    const consent: CookieConsent = { necessary: true, analytics: true };
    setState((prev) => ({
      ...prev,
      consent,
      hasConsented: true,
      consentedAt: Date.now(),
    }));
    logConsentInBackground(state.consentId, consent);
  }, [setState, state.consentId]);

  const rejectNonEssential = useCallback(() => {
    const consent: CookieConsent = { necessary: true, analytics: false };
    setState((prev) => ({
      ...prev,
      consent,
      hasConsented: true,
      consentedAt: Date.now(),
    }));
    logConsentInBackground(state.consentId, consent);
  }, [setState, state.consentId]);

  // Used by the "Manage preferences" dialog: saves whatever the user picked
  // per-category rather than an all-or-nothing choice.
  const updateConsent = useCallback(
    (analytics: boolean) => {
      const consent: CookieConsent = { necessary: true, analytics };
      setState((prev) => ({
        ...prev,
        consent,
        hasConsented: true,
        consentedAt: Date.now(),
      }));
      logConsentInBackground(state.consentId, consent);
    },
    [setState, state.consentId]
  );

  const value: CookieConsentContextValue = {
    consent: state.consent,
    // Stale consent is treated as "not consented" for banner-visibility purposes
    hasConsented: state.hasConsented && !isStale(state.consentedAt),
    acceptAll,
    rejectNonEssential,
    updateConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsentContext() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsentContext must be used within a CookieConsentProvider');
  }
  return context;
}