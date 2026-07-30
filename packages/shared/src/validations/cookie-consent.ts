import { z } from 'zod';

// `necessary` is always true and logged explicitly 
export const cookieConsentChoicesSchema = z.object({
  necessary: z.literal(true),
  analytics: z.boolean(),
}).strict();

export const cookieConsentLogSchema = z.object({
  // Client-generated correlation id (crypto.randomUUID()), not itself identifying
  consentId: z.string().uuid(),
  choices: cookieConsentChoicesSchema,
}).strict();

export type CookieConsentChoices = z.infer<typeof cookieConsentChoicesSchema>;
export type CookieConsentLogInput = z.infer<typeof cookieConsentLogSchema>;