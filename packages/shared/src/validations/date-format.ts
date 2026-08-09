import { z } from 'zod';

// Date field order for NUMERIC date rendering (24/12/2025 vs 12/24/2025).
// Named-month formats ("5 Jan 2025") stay language-conventional and are not driven by this preference.
export const SUPPORTED_DATE_FORMATS = ['DMY', 'MDY'] as const;

export const dateFormatSchema = z.enum(SUPPORTED_DATE_FORMATS, {
  errorMap: () => ({ message: 'Please select a valid date format' }),
});

export type DateFormat = z.infer<typeof dateFormatSchema>;

// Last-resort default when no stored preference and browser detection fails.
export const DEFAULT_DATE_FORMAT: DateFormat = 'DMY';