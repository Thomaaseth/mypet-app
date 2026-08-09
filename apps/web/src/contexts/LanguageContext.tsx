import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type Language } from '@/shared/validations/language';
import { useUpdateLanguage } from '@/queries/user-preferences';

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
  const { mutate: persistLanguage } = useUpdateLanguage();

  const currentLanguage: Language = isSupportedLanguage(i18n.language)
    ? i18n.language
    : 'en';

const setLanguage = useCallback(
    (nextLanguage: Language) => {
      // Client (localStorage via i18next-browser-languagedetector).
      void i18n.changeLanguage(nextLanguage);
      // Server — authoritative once onboarded; no-op (null) before that.
      persistLanguage(nextLanguage);
    },
    [i18n, persistLanguage]
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