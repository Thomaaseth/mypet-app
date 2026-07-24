import type { DateTimeLocale } from '@/shared/validations/locale';
import type { UnitSystem } from '@/shared/validations/units';

export const DATE_TIME_LOCALE_OPTIONS: { dateTimeLocale: DateTimeLocale }[] = [
  { dateTimeLocale: 'fr-FR' },
  { dateTimeLocale: 'en-US' },
];
 
export const UNIT_SYSTEM_OPTIONS: { unitSystem: UnitSystem }[] = [
  { unitSystem: 'metric' },
  { unitSystem: 'imperial' },
];