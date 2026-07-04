import { z } from 'zod';

// Supported locales — add new entries here, no DB migration required
export const SUPPORTED_DATE_TIME_LOCALES  = ['fr-FR', 'en-US'] as const;

export const dateTimeLocaleSchema = z.enum(SUPPORTED_DATE_TIME_LOCALES, {
  errorMap: () => ({ message: 'Please select a valid date/time format' }),
});


export type DateTimeLocale = z.infer<typeof dateTimeLocaleSchema>;

