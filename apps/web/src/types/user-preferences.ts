import type { Locale } from '@/shared/validations/locale';

export interface UserPreferences {
  id: string;
  userId: string;
  locale: Locale;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesFormData {
  locale: Locale;
}