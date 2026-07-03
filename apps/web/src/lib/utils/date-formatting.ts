import type { Locale } from '@/shared/validations/locale';

export const parseDateOnly = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // monthIndex is 0-based (Jan = 0)
  };
  
  export const SHORT_DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  export const LONG_DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  export const formatDateForDisplay = (
    dateString: string,
    locale: Locale,
    options: Intl.DateTimeFormatOptions = SHORT_DATE_DISPLAY_OPTIONS
  ): string => parseDateOnly(dateString).toLocaleDateString(locale, options);
  
  export const formatDateForInput = (dateString: string): string =>
    new Date(dateString).toISOString().split('T')[0];
  
  export const getTodayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  export const formatChartTickMonthYear = (timestampMs: number): string => {
    const date = new Date(timestampMs);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = String(date.getFullYear()).slice(-2);
    return `${month} '${year}`;
  };