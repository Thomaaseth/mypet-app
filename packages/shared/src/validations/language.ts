import { z } from 'zod';
 
// Supported UI languages, no DB migration required
export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
 
export const languageSchema = z.enum(SUPPORTED_LANGUAGES, {
  errorMap: () => ({ message: 'Please select a valid language' }),
});
 
export type Language = z.infer<typeof languageSchema>;
 
export const DEFAULT_LANGUAGE: Language = 'en';
 