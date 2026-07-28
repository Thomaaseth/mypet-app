import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { CookieConsent, CookieConsentState } from '@/types/cookie-consent';

const COOKIE_CONSENT_STORAGE_KEY = 'pettr-cookie-consent';

const DEFAULT_STATE: CookieConsentState = {
  consent: { necessary: true, analytics: false },
  hasConsented: false,
};

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
    setState({ consent: { necessary: true, analytics: true }, hasConsented: true });
  }, [setState]);

  const rejectNonEssential = useCallback(() => {
    setState({ consent: { necessary: true, analytics: false }, hasConsented: true });
  }, [setState]);

  // used by "manage preference" dialog => saves what the user picks
  const updateConsent = useCallback(
    (analytics: boolean) => {
      setState({ consent: { necessary: true, analytics }, hasConsented: true });
    },
    [setState]
  );

  const value: CookieConsentContextValue = {
    consent: state.consent,
    hasConsented: state.hasConsented,
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