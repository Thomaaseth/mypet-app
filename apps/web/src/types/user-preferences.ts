import type { DateTimeLocale  } from '@/shared/validations/locale';
import type { Timezone } from '@/shared/validations/timezone';
import type { UnitSystem } from '@/shared/validations/units';

export interface UserPreferences {
  id: string;
  userId: string;
  dateTimeLocale: DateTimeLocale ;
  unitSystem: UnitSystem;
  timezone: Timezone;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesFormData {
  dateTimeLocale: DateTimeLocale ;
  unitSystem: UnitSystem;
  timezone: Timezone;
}