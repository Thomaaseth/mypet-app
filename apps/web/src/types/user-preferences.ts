import type { DateFormat } from '@/shared/validations/date-format';
import type { TimeFormat } from '@/shared/validations/time-format';
import type { Language } from '@/shared/validations/language';
import type { Timezone } from '@/shared/validations/timezone';
import type { UnitSystem } from '@/shared/validations/units';

export interface UserPreferences {
  id: string;
  userId: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  language: Language | null; // null => not yet persisted; client i18n is source of truth
  unitSystem: UnitSystem;
  timezone: Timezone;
  createdAt: string;
  updatedAt: string;
}

// Banner/profile form; language is written separately
export interface UserPreferencesFormData {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  unitSystem: UnitSystem;
  timezone: Timezone;
}