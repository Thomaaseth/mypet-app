import { describe, it, expect } from 'vitest';
import { userPreferencesFormSchema } from '../user-preferences';
import { expectRejectsUnknownKey } from './_helpers';

const validPrefs = { dateTimeLocale: 'fr-FR' as const, unitSystem: 'metric' as const, timezone: 'Europe/Paris' };

describe('userPreferencesFormSchema', () => {
  it('accepts well-formed preferences', () => {
    expect(userPreferencesFormSchema.safeParse(validPrefs).success).toBe(true);
  });
  it('rejects an unsupported locale', () => {
    expect(userPreferencesFormSchema.safeParse({ ...validPrefs, dateTimeLocale: 'de-DE' }).success).toBe(false);
  });
  it('rejects an invalid timezone', () => {
    expect(userPreferencesFormSchema.safeParse({ ...validPrefs, timezone: 'Mars/Phobos' }).success).toBe(false);
  });
  it('rejects unknown keys (strict)', () => expectRejectsUnknownKey(userPreferencesFormSchema, validPrefs));
});