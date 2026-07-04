import { z } from 'zod';
import { dateTimeLocaleSchema } from './locale';
import { unitSystemSchema } from './units';
import { timezoneSchema } from './timezone';

export const userPreferencesFormSchema = z.object({
  dateTimeLocale: dateTimeLocaleSchema,
  unitSystem: unitSystemSchema,
  timezone: timezoneSchema,
});

export type UserPreferencesFormData = z.infer<typeof userPreferencesFormSchema>;

export function validateUserPreferencesData(data: unknown) {
  const result = userPreferencesFormSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`User preferences validation failed: ${errorMessage}`);
  }
  return result.data;
}