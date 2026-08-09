import type { DateFormat } from '@/shared/validations/date-format';
import type { TimeFormat } from '@/shared/validations/time-format';
import type { UnitSystem } from '@/shared/validations/units';

export const DATE_FORMAT_OPTIONS: { dateFormat: DateFormat }[] = [
  { dateFormat: 'DMY' },
  { dateFormat: 'MDY' },
];

export const TIME_FORMAT_OPTIONS: { timeFormat: TimeFormat }[] = [
  { timeFormat: '24h' },
  { timeFormat: '12h' },
];

export const UNIT_SYSTEM_OPTIONS: { unitSystem: UnitSystem }[] = [
  { unitSystem: 'metric' },
  { unitSystem: 'imperial' },
];