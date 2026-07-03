import type { Locale } from '@/shared/validations/locale';
import type { Timezone } from '@/shared/validations/timezone';

export interface UserPreferences {
  id: string;
  userId: string;
  locale: Locale;
  timezone: Timezone;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesFormData {
  locale: Locale;
  timezone: Timezone;
}