// `necessary` is always true and is not user-toggleable (session/auth cookie only)
export interface CookieConsent {
  necessary: true;
  analytics: boolean;
}

export interface CookieConsentState {
  consent: CookieConsent;
  hasConsented: boolean;
}