import { SUPPORTED_DATE_TIME_LOCALES, type DateTimeLocale  } from '@/shared/validations/locale';
import type { UnitSystem } from '@/shared/validations/units';

export const getFallbackDateTimeLocale = (): DateTimeLocale => {
  const browserLocale = navigator.language;
  
  // exact match first (e.g. 'fr-FR', 'en-US')
  // then try language prefix match (e.g. 'fr' → 'fr-FR', 'en' → 'en-US')
  const matched = SUPPORTED_DATE_TIME_LOCALES.find(
    (l: DateTimeLocale) => l === browserLocale || l.startsWith(browserLocale.split('-')[0])
  );

  return matched ?? 'en-US';
};

export const getFallbackUnitSystem = (): UnitSystem => 'metric';
