import { z } from 'zod';

// Supported locales — add new entries here, no DB migration required
export const SUPPORTED_LOCALES = ['fr-FR', 'en-US'] as const;

export const localeSchema = z.enum(SUPPORTED_LOCALES, {
  errorMap: () => ({ message: 'Please select a valid locale' }),
});

export const userPreferencesFormSchema = z.object({
    locale: localeSchema,
});

export type Locale = z.infer<typeof localeSchema>;
export type UserPreferencesFormData = z.infer<typeof userPreferencesFormSchema>;

// Derived units per locale — single source of truth for all locale-dependent formatting
export interface LocaleUnits {
  weightUnit: 'kg' | 'lbs';
  bagWeightUnit: 'kg' | 'pounds';
  wetFoodUnit: 'grams' | 'oz';
  dryDailyAmountUnit: 'grams'; // always grams, kept for clarity
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy';
}

export const localeUnitsMap: Record<Locale, LocaleUnits> = {
  'fr-FR': {
    weightUnit: 'kg',
    bagWeightUnit: 'kg',
    wetFoodUnit: 'grams',
    dryDailyAmountUnit: 'grams',
    dateFormat: 'dd/MM/yyyy',
  },
  'en-US': {
    weightUnit: 'lbs',
    bagWeightUnit: 'pounds',
    wetFoodUnit: 'oz',
    dryDailyAmountUnit: 'grams',
    dateFormat: 'MM/dd/yyyy',
  },
};

export function getUnitsForLocale(locale: Locale): LocaleUnits {
  return localeUnitsMap[locale];
}

export function validateUserPreferencesData(data: unknown) {
    const result = userPreferencesFormSchema.safeParse(data);
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(', ');
      throw new Error(`User preferences validation failed: ${errorMessage}`);
    }
    return result.data;
  }