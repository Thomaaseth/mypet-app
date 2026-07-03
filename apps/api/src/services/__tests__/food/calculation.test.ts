import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodEntry, makeWetFoodEntry, makeDryFoodData } from './helpers/factories';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { randomUUID } from 'crypto';
import { UserPreferencesService } from '../../user-preferences.service';
import { toDateString } from '@/shared/utils/dates';
import { addCalendarDays } from '@/shared/utils/dates';

describe('Business Logic Calculations', () => {
  describe('calculateDryFoodRemaining', () => {
    it('should calculate remaining days correctly for active dry food', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 5); // 5 days ago (days elapsed = 6)

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100.00',
        dryDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      // After 5 days at 100g/day, daysElapsed=6 (day 1 counts), 600g consumed, 1400g remaining
      // 1400g / 100g per day = 14 days remaining
      expect(result.remainingDays).toBe(14);
      expect(result.remainingWeight).toBeCloseTo(1.4, 2);
    });

    it('should return 0 remaining days for finished dry food', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 30); // 30 days ago

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100.00',
        dryDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: false,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      expect(result.remainingDays).toBe(0);
      expect(result.remainingWeight).toBe(0);
    });
  });

  describe('calculateWetFoodRemaining', () => {
    it('should calculate remaining days correctly for active wet food', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 3); // started 3 days ago => daysElapsed=4 (dateStarted = day 1)

      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 12,
        weightPerUnit: '85.00',
        wetWeightUnit: 'grams',
        dailyAmount: '170.00',
        wetDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });

      const result = await FoodService.calculateWetFoodRemaining(wetFoodEntry, randomUUID());

      // Total: 12 × 85g = 1020g
      // daysElapsed=4 (day 1 counts), 4 × 170g = 680g consumed, 340g remaining
      // 340g / 170g per day = 2 days remaining
      expect(result.remainingDays).toBe(2);
      expect(result.remainingWeight).toBeCloseTo(340, 1);
    });

    it('should handle unit conversions for wet food (oz to grams)', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 1);

      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 6,
        weightPerUnit: '3.00',
        wetWeightUnit: 'oz',
        dailyAmount: '6.00',
        wetDailyAmountUnit: 'oz',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });

      const result = await FoodService.calculateWetFoodRemaining(wetFoodEntry, randomUUID());
      // Total: 6 × 3oz = 18oz
      // daysElapsed=2 (day 1 counts), 2 × 6oz = 12oz consumed, 6oz remaining
      // 6oz / 6oz per day = 1 day remaining
      expect(result.remainingDays).toBe(1);
      expect(result.remainingWeight).toBeCloseTo(6, 1);
    });
    
    it('should handle wet food with grams weight and oz daily amount', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 1); // 1 day ago
  
      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 10,
        weightPerUnit: '100.00',
        wetWeightUnit: 'grams',
        dailyAmount: '10.00',
        wetDailyAmountUnit: 'oz',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });
  
      const result = await FoodService.calculateWetFoodRemaining(wetFoodEntry, randomUUID());
  
      // 10 units × 100g = 1000g total
      // 10oz daily = 283.495g daily
      // daysElapsed=2 (day 1 counts), 2 × 283.495g = 566.99g consumed, 433.01g remaining
      // 433.01g / 283.495g per day = 1.52... -> 1 day remaining
      expect(result.remainingDays).toBe(1);
      expect(result.remainingWeight).toBeCloseTo(433.01, 1); // remaining in grams
    });

    it('should handle wet food with oz weight and grams daily amount', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 1); // 1 day ago
  
      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 10,
        weightPerUnit: '1.00',
        wetWeightUnit: 'oz',
        dailyAmount: '50.00',
        wetDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });
  
      const result = await FoodService.calculateWetFoodRemaining(wetFoodEntry, randomUUID());
  
      // 10 units × 1oz = 10oz = 283.495g total
      // 50g daily
      // daysElapsed=2 (day 1 counts), 2 × 50g = 100g consumed, 183.495g remaining
      // 183.495g / 50g per day = 3.66... -> 3 days remaining
      expect(result.remainingDays).toBe(3);
      expect(result.remainingWeight).toBeCloseTo(6.47, 2); // 183.495g = 6.47oz
    });
  });

  describe('markFoodAsFinished', () => {
    it('should mark dry food as inactive when finished', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '1.0',
        bagWeightUnit: 'kg',
        dailyAmount: '50',
        dryDailyAmountUnit: 'grams',
        dateStarted: pastDate.toISOString().split('T')[0],
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
        // 5kg = 5000g total
        // Day 1: 100g consumed, 4900g remaining
        // 4900g / 100g per day = 49 days remaining
        bagWeight: '5.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        dateStarted: new Date().toISOString().split('T')[0],
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      expect(created.isActive).toBe(true);
  
      // Calculate remaining food
      const calculations = await FoodService.calculateDryFoodRemaining(created, primary.id);
      expect(calculations.remainingDays).toBeGreaterThan(0);
      expect(calculations.remainingWeight).toBeCloseTo(4.9, 1);
  
      // Verify the original entry is still active (calculations don't modify the entry)
      const fetched = await FoodService.getDryFoodEntryById(testPet.id, created.id, primary.id);
      expect(fetched.isActive).toBe(true);
    });
  });

  describe('Food Expiry Logic', () => {
    it('should calculate correct depletion date for active food', async () => {
      const today = new Date();
      const purchaseDate = new Date();
      purchaseDate.setDate(today.getDate() - 5); // 5 days ago

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '3.00',
        bagWeightUnit: 'kg',
        dailyAmount: '150.00',
        dryDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      const expectedDepletionDate = new Date();
      expectedDepletionDate.setDate(today.getDate() + 14);

      expect(result.remainingDays).toBe(14);
      expect(result.depletionDate).toBe(toDateString(expectedDepletionDate));
    });

    it('should calculate correct depletion date for finished food', async () => {
      const today = new Date();
      const purchaseDate = new Date();
      purchaseDate.setDate(today.getDate() - 25); // 25 days ago

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100.00',
        dryDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: false,
      });

      const result = await FoodService.calculateDryFoodRemaining(dryFoodEntry, randomUUID());

      const expectedDepletionDate = new Date(purchaseDate);
      expectedDepletionDate.setDate(purchaseDate.getDate() + 20);

      expect(result.remainingDays).toBe(0);
      expect(result.depletionDate).toBe(toDateString(expectedDepletionDate));
    });
  });

  describe('Timezone-aware "today"', () => {
    it('uses the stored user timezone, not server UTC, for depletion calculations', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      // UTC+14 — the furthest-ahead real IANA zone, chosen so a UTC-fallback bug
      // reliably produces a different, detectably wrong "today" (won't coincide with UTC's date)
      await UserPreferencesService.upsertUserPreferences(primary.id, {
        locale: 'en-US',
        timezone: 'Pacific/Kiritimati',
      });
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '1.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
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
      // actually prove timezone-awareness — fail loudly instead of silently passing
      if (expectedToday === serverUtcToday) {
        throw new Error(
          'Test invariant violated: Pacific/Kiritimati local date matched server UTC date at run time — pick a run time or offset where this test can actually distinguish the two.'
        );
      }
    });
  });
});
