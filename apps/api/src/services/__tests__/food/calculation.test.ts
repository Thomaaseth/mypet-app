import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodEntry, makeWetFoodEntry, makeDryFoodData, makeWetFoodData } from './helpers/factories';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { randomUUID } from 'crypto';
import { UserPreferencesService } from '../../user-preferences.service';
import { toDateString, addCalendarDays } from '@/shared/utils/dates';

describe('Business Logic Calculations', () => {
  // NOTE: tests in this describe block deliberately pass randomUUID() as the
  // userId, not a real primary.id with stored preferences. That's intentional:
  // a nonexistent user has no preferences row, so getTodayForUser() always
  // falls back to server-UTC-today — the same reference point these tests use
  // themselves (toDateString(new Date())). This isolates pure day-counting
  // math (FoodCalculations) from timezone resolution (getTodayForUser), and
  // does NOT exercise the real per-user timezone branch. See the dedicated
  // 'Timezone-aware "today"' describe block below for tests that do.
  describe('calculateDryFoodRemaining', () => {
    it('should calculate remaining days correctly for active dry food', async () => {
      const dateStarted = addCalendarDays(toDateString(new Date()), -5); // 5 days ago (days elapsed = 6)

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2000.00', // canonical grams (was 2.00 kg)
        dailyAmount: '100.00',
        dateStarted,
        isActive: true,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      // After 5 days at 100g/day, daysElapsed=6 (day 1 counts), 600g consumed, 1400g remaining
      // 1400g / 100g per day = 14 days remaining
      expect(result.remainingDays).toBe(14);
      expect(result.remainingWeight).toBe(1400);
    });

    it('should return 0 remaining days for finished dry food', async () => {
      const dateStarted = addCalendarDays(toDateString(new Date()), -30); // 30 days ago

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2000.00',
        dailyAmount: '100.00',
        dateStarted,
        isActive: false,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      expect(result.remainingDays).toBe(0);
      expect(result.remainingWeight).toBe(0);
    });
  });

  describe('calculateWetFoodRemaining', () => {
    it('should calculate remaining days correctly for active wet food', async () => {
      const dateStarted = addCalendarDays(toDateString(new Date()), -3); // started 3 days ago => daysElapsed=4 (dateStarted = day 1)

      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 12,
        weightPerUnit: '85.00',
        dailyAmount: '170.00',
        dateStarted,
        isActive: true,
      });

      const result = await FoodService.calculateWetFoodRemaining(wetFoodEntry, randomUUID());

      // Total: 12 × 85g = 1020g
      // daysElapsed=4 (day 1 counts), 4 × 170g = 680g consumed, 340g remaining
      // 340g / 170g per day = 2 days remaining
      expect(result.remainingDays).toBe(2);
      expect(result.remainingWeight).toBe(340);
    });
  });

  describe('markFoodAsFinished', () => {
    it('should mark dry food as inactive when finished', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      const dateStarted = addCalendarDays(toDateString(new Date()), -30);
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '1.0',
        bagWeightUnit: 'kg',
        dailyAmount: '50',
        dateStarted,
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      expect(created.isActive).toBe(true);
  
      // Mark as finished and verify
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);
      expect(finished.isActive).toBe(false);
  
      // Verify in database
      const [dbEntry] = await db.select()
        .from(schema.foodEntries)
        .where(eq(schema.foodEntries.id, created.id));
  
      expect(dbEntry.isActive).toBe(false);
    });
  });

  describe('calculateDryFoodRemaining', () => {
    it('should calculate remaining food without changing isActive status', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      const dryFoodData = makeDryFoodData({
        // 5kg bag submitted, converted+stored as 5000g canonical
        // Day 1: 100g consumed, 4900g remaining
        // 4900g / 100g per day = 49 days remaining
        bagWeight: '5.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted: toDateString(new Date()),
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      expect(created.isActive).toBe(true);
  
      // Calculate remaining food
      const calculations = await FoodService.calculateDryFoodRemaining(created, primary.id);
      expect(calculations.remainingDays).toBeGreaterThan(0);
      expect(calculations.remainingWeight).toBe(4900);
  
      // Verify the original entry is still active (calculations don't modify the entry)
      const fetched = await FoodService.getDryFoodEntryById(testPet.id, created.id, primary.id);
      expect(fetched.isActive).toBe(true);
    });
  });

  describe('Food Expiry Logic', () => {
    it('should calculate correct depletion date for active food', async () => {
      const todayStr = toDateString(new Date());
      const dateStarted = addCalendarDays(todayStr, -5); // 5 days ago

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '3000.00', // was 3.00 kg
        dailyAmount: '150.00',
        dateStarted,
        isActive: true,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      // Same UTC-string arithmetic the function itself uses — no local Date methods,
      // so this can't drift relative to the function's own computation.
      const expectedDepletionDate = addCalendarDays(todayStr, 14);

      expect(result.remainingDays).toBe(14);
      expect(result.depletionDate).toBe(expectedDepletionDate);
    });

    it('should calculate correct depletion date for finished food', async () => {
      const dateStarted = addCalendarDays(toDateString(new Date()), -25); // 25 days ago

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2000.00', // was 2.00 kg
        dailyAmount: '100.00',
        dateStarted,
        isActive: false,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      // Bag fully depleted before finish: function computes depletionDate as
      // dateStarted + totalConsumptionDays (2000g / 100g/day = 20 days)
      const expectedDepletionDate = addCalendarDays(dateStarted, 20);

      expect(result.remainingDays).toBe(0);
      expect(result.depletionDate).toBe(expectedDepletionDate);
    });
  });

  // Tests below use a real primary.id with a real stored timezone preference,
  // proving getTodayForUser's actual Intl.DateTimeFormat branch is correctly
  // wired into each service method, not just its no-preferences fallback
  describe('Timezone-aware "today"', () => {
    it('uses the stored user timezone, not server UTC, for depletion calculations', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      // UTC+14 the furthest-ahead real IANA zone, chosen so a UTC-fallback bug
      // reliably produces a different, detectably wrong "today" (won't coincide with UTC's date)
      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateTimeLocale: 'en-US',
        unitSystem: 'metric',
        timezone: 'Pacific/Kiritimati',
      });
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '2.2',
        bagWeightUnit: 'lbs',
        dailyAmount: '100',
        dateStarted: toDateString(new Date()),
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
  
      const expectedToday = await UserPreferencesService.getTodayForUser(primary.id);
      const serverUtcToday = toDateString(new Date());
  
      const calculations = await FoodService.calculateDryFoodRemaining(created, primary.id);
  
      // Depletion date is anchored to the user's local "today" + remainingDays
      expect(calculations.depletionDate).toBe(addCalendarDays(expectedToday, calculations.remainingDays));
  
      // Guard against a false-pass: if this ever coincides with server UTC's date
      // (e.g. test runs right at a UTC boundary), the assertion above wouldn't
      // actually prove timezone-awareness: fail loudly instead of silently passing
      if (expectedToday === serverUtcToday) {
        throw new Error(
          'Test invariant violated: Pacific/Kiritimati local date matched server UTC date at run time — pick a run time or offset where this test can actually distinguish the two.'
        );
      }
    });

    it('uses the stored user timezone, not server UTC, for wet food depletion calculations', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateTimeLocale: 'en-US',
        unitSystem: 'imperial',
        timezone: 'Pacific/Kiritimati',
      });

      const wetFoodData = makeWetFoodData({
        numberOfUnits: '12',
        weightPerUnit: '3',
        wetFoodUnit: 'oz',
        dailyAmount: '6',
        dateStarted: toDateString(new Date()),
      });

      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);

      const expectedToday = await UserPreferencesService.getTodayForUser(primary.id);
      const serverUtcToday = toDateString(new Date());

      const calculations = await FoodService.calculateWetFoodRemaining(created, primary.id);

      expect(calculations.depletionDate).toBe(addCalendarDays(expectedToday, calculations.remainingDays));

      if (expectedToday === serverUtcToday) {
        throw new Error(
          'Test invariant violated: Pacific/Kiritimati local date matched server UTC date at run time — pick a run time or offset where this test can actually distinguish the two.'
        );
      }
    });

    it('uses the stored user timezone, not server UTC, when listing all food entries', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateTimeLocale: 'en-US',
        unitSystem: 'imperial',
        timezone: 'Pacific/Kiritimati',
      });

      const dryFoodData = makeDryFoodData({
        bagWeight: '2.2',
        bagWeightUnit: 'lbs',
        dailyAmount: '100',
        dateStarted: toDateString(new Date()),
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

      const expectedToday = await UserPreferencesService.getTodayForUser(primary.id);
      const serverUtcToday = toDateString(new Date());
      const [entry] = await FoodService.getAllFoodEntries(testPet.id, primary.id);

      expect(entry.id).toBe(created.id);
      expect(entry.remainingDays).toBeDefined();

      if (entry.remainingDays === undefined) {
        throw new Error('Expected remainingDays to be populated on a listed food entry');
      }

      expect(entry.depletionDate).toBe(addCalendarDays(expectedToday, entry.remainingDays));

      if (expectedToday === serverUtcToday) {
        throw new Error(
          'Test invariant violated: Pacific/Kiritimati local date matched server UTC date at run time — pick a run time or offset where this test can actually distinguish the two.'
        );
      }
    });
  });
});