import { useMemo } from 'react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { usePreferencesContext } from '@/contexts/UserPreferencesContext';
import { getFallbackDateFormat, getFallbackTimeFormat } from '@/lib/utils/locale';
import {
  formatDateForDisplay,
  formatNumericDate,
  formatChartTickMonthYear,
} from '@/lib/utils/date-formatting';
import { formatTimeForDisplay } from '@/lib/validations/appointments';

export function useDateTimeFormatters() {
  const { language } = useLanguageContext();
  const { dateFormat, timeFormat } = usePreferencesContext();

  const resolvedDateFormat = dateFormat ?? getFallbackDateFormat();
  const resolvedTimeFormat = timeFormat ?? getFallbackTimeFormat();

  return useMemo(
    () => ({
      // Named-month display (short by default, or pass LONG_DATE_DISPLAY_OPTIONS).
      // Month/weekday names follow the UI language.
      formatDate: (dateString: string, options?: Intl.DateTimeFormatOptions) =>
        formatDateForDisplay(dateString, language, options),
      // Numeric date; field order follows the dateFormat preference.
      formatNumericDate: (dateString: string) =>
        formatNumericDate(dateString, resolvedDateFormat),
      // Clock follows the timeFormat preference.
      formatTime: (timeString: string) =>
        formatTimeForDisplay(timeString, resolvedTimeFormat, language),
      // Recharts tick.
      formatChartTick: (timestampMs: number) =>
        formatChartTickMonthYear(timestampMs, language),
    }),
    [language, resolvedDateFormat, resolvedTimeFormat]
  );
}