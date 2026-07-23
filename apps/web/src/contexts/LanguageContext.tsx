import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@/shared/validations/language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  supportedLanguages: readonly Language[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();

  const currentLanguage: Language = isSupportedLanguage(i18n.language)
    ? i18n.language
    : 'en';

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      // i18next-browser-languagedetector's `caches: ['localStorage']` config
      // persists this automatically on changeLanguage — no manual write needed.
      void i18n.changeLanguage(nextLanguage);
    },
    [i18n]
  );

  const value: LanguageContextValue = {
    language: currentLanguage,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}