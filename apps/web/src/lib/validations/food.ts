export * from '@/shared/validations/food';
import type { Locale } from '@/shared/validations/locale';

// DATE HELPER
export const formatDateForDisplay = (dateString: string, locale: Locale): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  