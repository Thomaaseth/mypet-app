import { z } from 'zod';

const VALID_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));

export const timezoneSchema = z
  .string()
  .refine((tz) => VALID_TIMEZONES.has(tz), {
    message: 'Please provide a valid IANA timezone (e.g. "Europe/Paris")',
  });

export type Timezone = z.infer<typeof timezoneSchema>;