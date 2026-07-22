import { describe, it, expect } from 'vitest';
import { UserPreferencesService } from '../../user-preferences.service';
import { DatabaseTestUtils } from '../../../test/database-test-utils';
import { makeUserPreferencesData } from './factories';
import { toDateString } from '@/shared/utils/dates';
import { BadRequestError } from '@/middleware/errors';
import { useFixedTimeForTimezoneTests } from '../../../test/timezone-test-utils';

describe('UserPreferencesService', () => {
  describe('getUserPreferences', () => {
    it('returns null when the user has no preferences row yet', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      const result = await UserPreferencesService.getUserPreferences(primary.id);

      expect(result).toBeNull();
    });

    it('returns the stored preferences when they exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      await UserPreferencesService.upsertUserPreferences(
        primary.id,
        makeUserPreferencesData({ timezone: 'Europe/Paris' })
      );

      const result = await UserPreferencesService.getUserPreferences(primary.id);

      expect(result).not.toBeNull();
      expect(result?.timezone).toBe('Europe/Paris');
      expect(result?.userId).toBe(primary.id);
    });
  });

  describe('upsertUserPreferences', () => {
    it('creates a new row when none exists', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      const result = await UserPreferencesService.upsertUserPreferences(
        primary.id,
        makeUserPreferencesData()
      );

      expect(result.userId).toBe(primary.id);
      expect(result.dateTimeLocale).toBe('en-US');
      expect(result.unitSystem).toBe('imperial');
      expect(result.timezone).toBe('America/New_York');
    });
    it('updates the existing row on a second call, rather than creating a duplicate', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      const created = await UserPreferencesService.upsertUserPreferences(
        primary.id,
        makeUserPreferencesData({ unitSystem: 'metric' })
      );

      const updated = await UserPreferencesService.upsertUserPreferences(
        primary.id,
        makeUserPreferencesData({ unitSystem: 'imperial', timezone: 'Asia/Tokyo' })
      );

      // Same row (same id), not a second row — enforced by the unique userId
      // constraint at the DB level, but asserted here at the service level too
      expect(updated.id).toBe(created.id);
      expect(updated.unitSystem).toBe('imperial');
      expect(updated.timezone).toBe('Asia/Tokyo');

      const fetched = await UserPreferencesService.getUserPreferences(primary.id);
      expect(fetched?.id).toBe(created.id);
    });

    it('keeps preferences isolated per user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();

      await UserPreferencesService.upsertUserPreferences(
        primary.id,
        makeUserPreferencesData({ unitSystem: 'metric' })
      );
      await UserPreferencesService.upsertUserPreferences(
        secondary.id,
        makeUserPreferencesData({ unitSystem: 'imperial' })
      );

      const primaryPrefs = await UserPreferencesService.getUserPreferences(primary.id);
      const secondaryPrefs = await UserPreferencesService.getUserPreferences(secondary.id);

      expect(primaryPrefs?.unitSystem).toBe('metric');
      expect(secondaryPrefs?.unitSystem).toBe('imperial');
    });

    it('updates updatedAt but preserves createdAt on an update', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
  
        const created = await UserPreferencesService.upsertUserPreferences(
          primary.id,
          makeUserPreferencesData()
        );
  
        await new Promise(resolve => setTimeout(resolve, 10)); // ensure a distinguishable timestamp
  
        const updated = await UserPreferencesService.upsertUserPreferences(
          primary.id,
          makeUserPreferencesData({ unitSystem: 'metric' })
        );
        expect(updated.createdAt).toEqual(created.createdAt);
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });
  });

  describe('getTodayForUser', () => {
    useFixedTimeForTimezoneTests();

    it('falls back to server-UTC-today when the user has no preferences row', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      const result = await UserPreferencesService.getTodayForUser(primary.id);

      expect(result).toBe(toDateString(new Date()));
    });

    it('uses the stored IANA timezone, not server UTC, once preferences exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      // UTC+14 — furthest-ahead real IANA zone, chosen so a UTC-fallback bug
      // reliably produces a different, detectably wrong "today"
      await UserPreferencesService.upsertUserPreferences(
        primary.id,
        makeUserPreferencesData({ timezone: 'Pacific/Kiritimati' })
      );

      const result = await UserPreferencesService.getTodayForUser(primary.id);
      const serverUtcToday = toDateString(new Date());
      expect(result).not.toBe(serverUtcToday);

      const expected = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati' }).format(new Date());
      expect(result).toBe(expected);
    });
  });

  describe('upsertUserPreferences — concurrent first-time upsert (documents existing race)', () => {
    it('lets one concurrent insert win and rejects the other with a generic error', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      // upsertUserPreferences does SELECT-then-INSERT-or-UPDATE, not an atomic
      // ON CONFLICT DO UPDATE (see the TODO comment in the service). Two
      // simultaneous first-time calls can both see "no existing row" and both
      // attempt INSERT; the DB's unique constraint on userId then rejects the
      // second one. This test documents that current behavior — it is not
      // asserting this is correct, only that it's what happens today.
      const results = await Promise.allSettled([
        UserPreferencesService.upsertUserPreferences(primary.id, makeUserPreferencesData()),
        UserPreferencesService.upsertUserPreferences(primary.id, makeUserPreferencesData({ unitSystem: 'metric' })),
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      // Exactly one wins, one loses — not both succeeding, not both failing
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // The loser surfaces as a generic BadRequestError, not a specific
      // "already exists, retry" signal — the unique-constraint violation gets
      // swallowed by the service's catch-all and rethrown with a generic message
      const rejection = rejected[0] as PromiseRejectedResult;
      expect(rejection.reason).toBeInstanceOf(BadRequestError);
      expect(rejection.reason.message).toBe('Failed to save user preferences');

      // Exactly one row ends up persisted for this user, not zero, not two
      const finalState = await UserPreferencesService.getUserPreferences(primary.id);
      expect(finalState).not.toBeNull();
    });
  });
});