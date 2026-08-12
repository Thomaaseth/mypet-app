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
import { useFixedTimeForTimezoneTests } from '../../../test/timezone-test-utils';
import { FoodCalculations } from '../../food/calculations';

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

      // Bag depleted: last day food is available is dateStarted + (totalConsumptionDays - 1),
      // per the Day-1-inclusive convention (2000g / 100g/day = 20 days → offset 19).
      const expectedDepletionDate = addCalendarDays(dateStarted, 19);

      expect(result.remainingDays).toBe(0);
      expect(result.depletionDate).toBe(expectedDepletionDate);
    });

    it('should calculate correct depletion date for depleted wet food (Day-1 inclusive)', async () => {
      const todayStr = toDateString(new Date());
      const dateStarted = addCalendarDays(todayStr, -11); // day 1 = dateStarted → 12 inclusive days

      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 12,
        weightPerUnit: '85.00',
        dailyAmount: '85.00',
        dateStarted,
        isActive: true,
      });

      const result = await FoodService.calculateWetFoodRemaining(wetFoodEntry, randomUUID());

      // 12 * 85g / 85g per day = 12 days of food. Day-1 inclusive => last day food
      // exists is dateStarted + (12 - 1), i.e. exactly today.
      const expectedDepletionDate = addCalendarDays(dateStarted, 11);

      expect(result.remainingDays).toBe(0);
      expect(result.depletionDate).toBe(expectedDepletionDate);
      expect(result.depletionDate).toBe(todayStr); // depletes today, not tomorrow — the reported bug
    });

    it('remainingDays counts a whole day of food despite float rounding (unit-converted grams)', () => {
      // 12 x 85.05g at 170.10g/day = exactly 6 days of food (from 3oz / 6oz converted).
      // On day 2 (1 elapsed inclusive → daysElapsed 2), 4 whole days remain, but
      // 680.3999… / 170.10 floats to 3.999999… — naive Math.floor would report 3.
      const dateStarted = '2026-01-01';
      const entry = makeWetFoodEntry({
        numberOfUnits: 12,
        weightPerUnit: '85.05',
        dailyAmount: '170.10',
        dateStarted,
      });

      const result = FoodCalculations.calculateWetFoodRemaining(entry, addCalendarDays(dateStarted, 1));

      expect(result.remainingDays).toBe(4);
    });
  });

  describe('FoodCalculations — depletion invariants (pure day-math)', () => {
    it('depletion date is fixed by the entry and does not drift as today advances', () => {
      const dateStarted = '2026-01-01';
      const entry = makeWetFoodEntry({
        numberOfUnits: 10,
        weightPerUnit: '100.00', // 1000g total
        dailyAmount: '75.00',    // 1000 / 75 = 13.33 → 14 inclusive days
        dateStarted,
      });

      const observedDay4 = FoodCalculations.calculateWetFoodRemaining(entry, addCalendarDays(dateStarted, 3));
      const observedDay10 = FoodCalculations.calculateWetFoodRemaining(entry, addCalendarDays(dateStarted, 9));

      expect(observedDay4.depletionDate).toBe(observedDay10.depletionDate); // no drift
      expect(observedDay4.depletionDate).toBe(addCalendarDays(dateStarted, 13)); // 14 inclusive days → +13
    });

    it('counts the final short-ration day (ceil) for amounts that do not divide evenly', () => {
      const dateStarted = '2026-01-01';
      const entry = makeDryFoodEntry({
        bagWeight: '1000.00',
        dailyAmount: '85.00', // 1000 / 85 = 11.76 → 12 inclusive days (11 full + 1 short)
        dateStarted,
      });

      // Observed with 150g left (2 feeding days remain: one full, one short).
      // The old floor/today-anchored branch reported start+10; correct is start+11.
      const result = FoodCalculations.calculateDryFoodRemaining(entry, addCalendarDays(dateStarted, 9));

      expect(result.depletionDate).toBe(addCalendarDays(dateStarted, 11));
    });
  });

  // Tests below use a real primary.id with a real stored timezone preference,
  // proving getTodayForUser's actual Intl.DateTimeFormat branch is correctly
  // wired into each service method, not just its no-preferences fallback
  describe('Timezone-aware "today"', () => {
    useFixedTimeForTimezoneTests();

    it('uses the stored user timezone, not server UTC, for depletion calculations', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      // UTC+14 the furthest-ahead real IANA zone, chosen so a UTC-fallback bug
      // reliably produces a different, detectably wrong "today" (won't coincide with UTC's date)
      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateFormat: 'MDY',
        timeFormat: '12h',
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

      // Time is pinned inside the Kiritimati/UTC divergence window by
      // useFixedTimeForTimezoneTests(), so this is no longer a runtime coincidence risk.
      expect(expectedToday).not.toBe(serverUtcToday);
  
      const calculations = await FoodService.calculateDryFoodRemaining(created, primary.id);
  
      // Timezone changes the day count (remaining weight/days) — NOT the depletion date,
      // which is a fixed property of the entry (start + total days of food).
      const viaUserTz = FoodCalculations.calculateDryFoodRemaining(created, expectedToday);
      const viaServerUtc = FoodCalculations.calculateDryFoodRemaining(created, serverUtcToday);

      // tz is a real discriminator: the two "todays" give different remaining amounts.
      expect(viaUserTz.remainingDays).not.toBe(viaServerUtc.remainingDays);
      // depletion is tz-independent by design — documented as an invariant.
      expect(viaUserTz.depletionDate).toBe(viaServerUtc.depletionDate);

      // The service resolved the USER's timezone → its output matches the user-tz computation.
      expect(calculations.remainingDays).toBe(viaUserTz.remainingDays);
      expect(calculations.remainingWeight).toBe(viaUserTz.remainingWeight);
      expect(calculations.depletionDate).toBe(viaUserTz.depletionDate);
    });

    it('uses the stored user timezone, not server UTC, for wet food depletion calculations', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateFormat: 'MDY',
        timeFormat: '12h',
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
      expect(expectedToday).not.toBe(serverUtcToday);

      const calculations = await FoodService.calculateWetFoodRemaining(created, primary.id);

      // Timezone changes the day count (remaining weight/days) — NOT the depletion date,
      // which is a fixed property of the entry (start + total days of food).
      const viaUserTz = FoodCalculations.calculateWetFoodRemaining(created, expectedToday);
      const viaServerUtc = FoodCalculations.calculateWetFoodRemaining(created, serverUtcToday);

      // tz is a real discriminator: the two "todays" give different remaining amounts.
      expect(viaUserTz.remainingDays).not.toBe(viaServerUtc.remainingDays);
      // depletion is tz-independent by design — documented as an invariant.
      expect(viaUserTz.depletionDate).toBe(viaServerUtc.depletionDate);

      // The service resolved the USER's timezone → its output matches the user-tz computation.
      expect(calculations.remainingDays).toBe(viaUserTz.remainingDays);
      expect(calculations.remainingWeight).toBe(viaUserTz.remainingWeight);
      expect(calculations.depletionDate).toBe(viaUserTz.depletionDate);
    });

it('uses the stored user timezone, not server UTC, when listing all food entries', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateFormat: 'MDY',
        timeFormat: '12h',
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
      expect(expectedToday).not.toBe(serverUtcToday);

      const [entry] = await FoodService.getAllFoodEntries(testPet.id, primary.id);

      expect(entry.id).toBe(created.id);

      if (entry.remainingDays === undefined) {
        throw new Error('Expected remainingDays to be populated on a listed food entry');
      }

      const viaUserTz = FoodCalculations.calculateDryFoodRemaining(created, expectedToday);
      const viaServerUtc = FoodCalculations.calculateDryFoodRemaining(created, serverUtcToday);

      // tz is a real discriminator: the two "todays" give different remaining amounts.
      expect(viaUserTz.remainingDays).not.toBe(viaServerUtc.remainingDays);

      // The LISTING surfaced the user-tz numbers, not server-UTC — this is the actual proof.
      expect(entry.remainingDays).toBe(viaUserTz.remainingDays);
      expect(entry.depletionDate).toBe(viaUserTz.depletionDate); // tz-independent, but must still match
    });
  });
});
