import type { UserPreferencesFormData } from '@/shared/validations/user-preferences';

export function makeUserPreferencesData(
  overrides: Partial<UserPreferencesFormData> = {}
): UserPreferencesFormData {
  return {
    dateTimeLocale: 'en-US',
    unitSystem: 'imperial',
    timezone: 'America/New_York',
    ...overrides,
  };
}