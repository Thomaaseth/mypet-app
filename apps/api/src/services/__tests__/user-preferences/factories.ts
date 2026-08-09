import type { UserPreferencesFormData } from '@/shared/validations/user-preferences';

export function makeUserPreferencesData(
  overrides: Partial<UserPreferencesFormData> = {}
): UserPreferencesFormData {
  return {
    dateFormat: 'MDY',
    timeFormat: '12h',
    unitSystem: 'imperial',
    timezone: 'America/New_York',
    ...overrides,
  };
}