import { DEFAULT_DATE_FORMAT, type DateFormat } from '@/shared/validations/date-format';
import { DEFAULT_TIME_FORMAT, type TimeFormat } from '@/shared/validations/time-format';
import type { UnitSystem } from '@/shared/validations/units';

// Browser-derived fallback for numeric date order; used only before the stored
// preference is available.
export const getFallbackDateFormat = (): DateFormat => {
  try {
    const parts = new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date(2000, 0, 2));
    const dayIndex = parts.findIndex((p) => p.type === 'day');
    const monthIndex = parts.findIndex((p) => p.type === 'month');
    return dayIndex !== -1 && dayIndex < monthIndex ? 'DMY' : 'MDY';
  } catch {
    return DEFAULT_DATE_FORMAT;
  }
};

// Browser-derived fallback for clock format.
export const getFallbackTimeFormat = (): TimeFormat => {
  try {
    const { hourCycle } = new Intl.DateTimeFormat(navigator.language, {
      hour: 'numeric',
    }).resolvedOptions();
    return hourCycle === 'h23' || hourCycle === 'h24' ? '24h' : '12h';
  } catch {
    return DEFAULT_TIME_FORMAT;
  }
};

export const getFallbackUnitSystem = (): UnitSystem => 'metric';