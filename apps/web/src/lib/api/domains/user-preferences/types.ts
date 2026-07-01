import type { UserPreferences, UserPreferencesFormData } from '@/types/user-preferences';

export interface UserPreferencesApiResponse {
  preferences: UserPreferences | null;
}

export interface UserPreferencesError {
  message: string;
  field?: keyof UserPreferencesFormData;
  code: string;
}