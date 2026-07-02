import { SUPPORTED_LOCALES, type Locale } from '@/shared/validations/locale';

export const getFallbackLocale = (): Locale => {
  const browserLocale = navigator.language;
  
  // exact match first (e.g. 'fr-FR', 'en-US')
  // then try language prefix match (e.g. 'fr' → 'fr-FR', 'en' → 'en-US')
  const matched = SUPPORTED_LOCALES.find(
    l => l === browserLocale || l.startsWith(browserLocale.split('-')[0])
  );

  return matched ?? 'en-US';
};