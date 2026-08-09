import { z } from 'zod';

// Clock format. Applied via the Intl `hour12` option at format time
// fully decoupled from language and region.
export const SUPPORTED_TIME_FORMATS = ['24h', '12h'] as const;

export const timeFormatSchema = z.enum(SUPPORTED_TIME_FORMATS, {
  errorMap: () => ({ message: 'Please select a valid time format' }),
});

export type TimeFormat = z.infer<typeof timeFormatSchema>;

// Last-resort default when no stored preference and browser detection fails.
export const DEFAULT_TIME_FORMAT: TimeFormat = '24h';