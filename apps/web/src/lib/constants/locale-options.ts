import type { DateTimeLocale } from '@/shared/validations/locale';
import type { UnitSystem } from '@/shared/validations/units';

export const DATE_TIME_LOCALE_OPTIONS: { dateTimeLocale: DateTimeLocale; label: string; description: string }[] = [
  { dateTimeLocale: 'fr-FR', label: '24-hour', description: 'DD/MM/YYYY · 24h clock' },
  { dateTimeLocale: 'en-US', label: '12-hour', description: 'MM/DD/YYYY · 12h clock' },
];

export const UNIT_SYSTEM_OPTIONS: { unitSystem: UnitSystem; label: string; description: string }[] = [
  { unitSystem: 'metric', label: 'Metric', description: 'kg · grams' },
  { unitSystem: 'imperial', label: 'Imperial', description: 'lbs · oz' },
];