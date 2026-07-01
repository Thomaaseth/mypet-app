import type { Locale } from '@/shared/validations/locale';

export const LOCALE_OPTIONS: { locale: Locale; label: string; description: string }[] = [
  { locale: 'fr-FR', label: 'Metric', description: 'kg · grams · Date Format: DD/MM/YYYY' },
  { locale: 'en-US', label: 'Imperial', description: 'lbs · oz · Date Format: MM/DD/YYYY' },
];