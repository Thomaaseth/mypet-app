import { z } from 'zod';
import { unitSystemSchema } from './units';
import { timezoneSchema } from './timezone';
import { dateFormatSchema } from './date-format';
import { timeFormatSchema } from './time-format';
import { languageSchema } from './language';

export const userPreferencesFormSchema = z.object({
  dateFormat: dateFormatSchema,
  timeFormat: timeFormatSchema,
  unitSystem: unitSystemSchema,
  timezone: timezoneSchema,
}).strict();

export type UserPreferencesFormData = z.infer<typeof userPreferencesFormSchema>;

export function validateUserPreferencesData(data: unknown) {
  const result = userPreferencesFormSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`User preferences validation failed: ${errorMessage}`);
  }
  return result.data;
}

// Language is persisted independently of the banner/profile form (written from
// the global footer switch via its own endpoint), so it has its own request contract.
export const languageUpdateSchema = z.object({
  language: languageSchema,
}).strict();
 
export type LanguageUpdateData = z.infer<typeof languageUpdateSchema>;