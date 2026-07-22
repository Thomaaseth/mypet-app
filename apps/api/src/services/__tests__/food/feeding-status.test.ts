import { describe, it, expect } from 'vitest';
import { FoodService, FoodCalculations } from '../../food';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData, makeWetFoodData } from './helpers/factories';
import { addCalendarDays, toDateString } from '@/shared/utils/dates';
import { UserPreferencesService } from '../../user-preferences.service';
import { useFixedTimeForTimezoneTests } from '../../../test/timezone-test-utils';

describe('Feeding Status & Actual Consumption Calculations', () => {
  
  describe('calculateActualConsumption - Basic Logic', () => {
    it('should calculate actual consumption for dry food finished on time', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Create dry food: 2kg bag, 100g/day, expected 20 days
      // dateStarted is 19 days before "today" — today itself counts as day 1
      // of consumption (inclusive-both-ends), so 19 days back + today = 20 elapsed days
      const dateStarted = addCalendarDays(toDateString(new Date()), -19);

      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      
      // Mark as finished after exactly 20 days
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      // Verify consumption calculations
      expect(finished.actualDaysElapsed).toBe(20);
      expect(finished.actualDailyConsumption).toBeCloseTo(100, 1); // 2000g / 20 days = 100g/day
      expect(finished.expectedDailyConsumption).toBe(100);
      expect(finished.variancePercentage).toBeCloseTo(0, 1); // Perfect match
      expect(finished.feedingStatus).toBe('normal');
    });

    it('should calculate actual consumption for wet food finished on time', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Create wet food: 12 cans × 85g = 1020g, 170g/day, expected 6 days
      const dateStarted = addCalendarDays(toDateString(new Date()), -5);

      const wetFoodData = makeWetFoodData({
        numberOfUnits: '12',
        weightPerUnit: '85',
        wetFoodUnit: 'grams',
        dailyAmount: '170',
        dateStarted,
      });

      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      expect(finished.actualDaysElapsed).toBe(6);
      expect(finished.actualDailyConsumption).toBeCloseTo(170, 1); // 1020g / 6 days
      expect(finished.expectedDailyConsumption).toBe(170);
      expect(finished.variancePercentage).toBeCloseTo(0, 1);
      expect(finished.feedingStatus).toBe('normal');
    });
  });

  describe('Overfeeding Detection', () => {
    it('should detect overfeeding when food finishes too quickly (>5% variance)', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Expected: 2kg / 100g/day = 20 days
      // Actual: Finished in 15 days (consumed 133.33g/day)
      // Variance: (133.33 - 100) / 100 = +33.33% > 5% = OVERFEEDING
      const dateStarted = addCalendarDays(toDateString(new Date()), -14);

      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      expect(finished.actualDaysElapsed).toBe(15);
      expect(finished.actualDailyConsumption).toBeCloseTo(133.33, 1);
      expect(finished.expectedDailyConsumption).toBe(100);
      expect(finished.variancePercentage).toBeCloseTo(33.33, 1);
      expect(finished.feedingStatus).toBe('overfeeding');
    });

    it('should detect overfeeding for wet food with oz units', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Expected: 10 cans × 3oz = 30oz = 850.485g, 6oz/day = 170.097g/day, ~5 days
      // Actual: Finished in 3 days (consumed 283.495g/day)
      // Variance: (283.495 - 170.097) / 170.097 = +66.67% > 5% = OVERFEEDING
      const dateStarted = addCalendarDays(toDateString(new Date()), -2);

      const wetFoodData = makeWetFoodData({
        numberOfUnits: '10',
        weightPerUnit: '3.0',
        wetFoodUnit: 'oz',
        dailyAmount: '6.0',
        dateStarted,
      });

      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      expect(finished.actualDaysElapsed).toBe(3);
      expect(finished.variancePercentage).toBeGreaterThan(5);
      expect(finished.feedingStatus).toBe('overfeeding');
    });

    it('should detect overfeeding at boundary (~7.5% variance => overfeeding)', async () => {
      const { primary, testPet } = await setupUserAndPet();
      // 10750g / 200g/day = 53.75 days expected
      // Finish in 50 days: 10750g / 50 days = 215g/day
      // Variance: (215 - 200) / 200 = +7.5% = OVERFEEDING
      const dateStarted = addCalendarDays(toDateString(new Date()), -49);
    
      const dryFoodData = makeDryFoodData({
        bagWeight: '10.75',
        bagWeightUnit: 'kg',
        dailyAmount: '200',
        dateStarted,
      });
    
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);
    
      expect(finished.actualDaysElapsed).toBe(50);
      expect(finished.variancePercentage).toBeCloseTo(7.5, 1);
      expect(finished.feedingStatus).toBe('overfeeding');
    });
});

  describe('Underfeeding Detection', () => {
    it('should detect underfeeding when food lasts too long (< -5% variance)', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Expected: 2kg / 100g/day = 20 days
      // Actual: Finished in 25 days (consumed 80g/day)
      // Variance: (80 - 100) / 100 = -20% < -5% = UNDERFEEDING
      const dateStarted = addCalendarDays(toDateString(new Date()), -24);

      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      expect(finished.actualDaysElapsed).toBe(25);
      expect(finished.actualDailyConsumption).toBe(80);
      expect(finished.expectedDailyConsumption).toBe(100);
      expect(finished.variancePercentage).toBe(-20);
      expect(finished.feedingStatus).toBe('underfeeding');
    });

    it('should detect underfeeding for wet food', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Expected: 1020g / 170g/day = 6 days
      // Actual: Finished in 8 days (consumed 127.5g/day)
      // Variance: (127.5 - 170) / 170 = -25% < -5% = UNDERFEEDING
      const dateStarted = addCalendarDays(toDateString(new Date()), -7);

      const wetFoodData = makeWetFoodData({
        numberOfUnits: '12',
        weightPerUnit: '85',
        wetFoodUnit: 'grams',
        dailyAmount: '170',
        dateStarted,
      });

      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      expect(finished.actualDaysElapsed).toBe(8);
      expect(finished.variancePercentage).toBeLessThan(-5);
      expect(finished.feedingStatus).toBe('underfeeding');
    });
  });

  describe('Normal Feeding (Within ±5% Tolerance)', () => {
    it('should mark as normal when within +5% tolerance', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Expected: 2kg / 100g/day = 20 days
      // Actual: Finished in 19 days (consumed 105.26g/day)
      // 2000g / 19 days = 105.26g/day
      // Variance = (105.26 - 100) / 100 = +5.26%
      // This should still be normal if within 5% with BUFFER
      const dateStarted = addCalendarDays(toDateString(new Date()), -18);

      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      expect(finished.variancePercentage).toBeCloseTo(5.26, 1);
      expect(finished.feedingStatus).toBe('normal');
    });

    it('should mark as normal when within -5% tolerance', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Expected: 2kg / 100g/day = 20 days
      // Actual: Finished in 21 days (consumed 95.24g/day)
      // Variance: (95.24 - 100) / 100 = -4.76% (within -5% tolerance)
      const dateStarted = addCalendarDays(toDateString(new Date()), -20);

      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      expect(finished.actualDaysElapsed).toBe(21);
      expect(finished.variancePercentage).toBeCloseTo(-4.76, 1);
      expect(finished.feedingStatus).toBe('normal');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum 1 day elapsed for same-day finish', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Started and finished same day
      const dateStarted = toDateString(new Date());

      const dryFoodData = makeDryFoodData({
        bagWeight: '0.1',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

      // Even same-day gets minimum 1 day elapsed
      expect(finished.actualDaysElapsed).toBe(1);
      expect(finished.actualDailyConsumption).toBe(100); // 100g / 1 day
      expect(finished.expectedDailyConsumption).toBe(100);
      expect(finished.feedingStatus).toBe('normal');
    });

    it('should throw error when calculating consumption without dateFinished', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted: toDateString(new Date()),
      });

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

      // Try to calculate consumption on active entry (no dateFinished)
      expect(() => {
        FoodCalculations.calculateActualConsumption(created);
      }).toThrow('Cannot calculate consumption');
    });
  });

  describe('Warning Statuses (5.5% - 7.5% Range)', () => {
    it('should detect slightly-over when between 5.5% and 7%', async () => {
      const { primary, testPet } = await setupUserAndPet();
      // Better: 3kg / 100g = 30 days expected
      // Finish in 28 days = 107.14g/day
      // Variance = (107.14 - 100) / 100 = +7.14% = SLIGHTLY-OVER
      const dateStarted = addCalendarDays(toDateString(new Date()), -27);
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '3.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);
  
      expect(finished.actualDaysElapsed).toBe(28);
      expect(finished.actualDailyConsumption).toBeCloseTo(107.14, 1);
      expect(finished.variancePercentage).toBeGreaterThan(5.5);
      expect(finished.variancePercentage).toBeLessThan(7.5);
      expect(finished.feedingStatus).toBe('slightly-over');
    });
  
    it('should detect slightly-under when between -7.5% and -5.5%', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      // Expected: 3kg / 100g/day = 30 days
      // Actual: Finished in 32 days (consumed 93.75g/day)
      // Variance: (93.75 - 100) / 100 = -6.25% = SLIGHTLY-UNDER
      const dateStarted = addCalendarDays(toDateString(new Date()), -31);
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '3.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);
  
      expect(finished.actualDaysElapsed).toBe(32);
      expect(finished.actualDailyConsumption).toBeCloseTo(93.75, 1);
      expect(finished.variancePercentage).toBeGreaterThan(-7.5);
      expect(finished.variancePercentage).toBeLessThan(-5.5);
      expect(finished.feedingStatus).toBe('slightly-under');
    });
  
    it('should detect overfeeding when above 7.5% threshold', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      // Expected: 2kg / 100g/day = 20 days
      // Actual: Finished in 18 days (consumed 111.11g/day)
      // Variance: (111.11 - 100) / 100 = +11.11% = OVERFEEDING
      const dateStarted = addCalendarDays(toDateString(new Date()), -17);
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);
  
      expect(finished.actualDaysElapsed).toBe(18);
      expect(finished.actualDailyConsumption).toBeCloseTo(111.11, 1);
      expect(finished.variancePercentage).toBeGreaterThan(7.5);
      expect(finished.feedingStatus).toBe('overfeeding');
    });
  
    it('should detect underfeeding when below -7.5% threshold', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      // Expected: 2kg / 100g/day = 20 days
      // Actual: Finished in 22 days (consumed 90.91g/day)
      // Variance: (90.91 - 100) / 100 = -9.09% = UNDERFEEDING
      const dateStarted = addCalendarDays(toDateString(new Date()), -21);
  
      const dryFoodData = makeDryFoodData({
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dateStarted,
      });
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);
  
      expect(finished.actualDaysElapsed).toBe(22);
      expect(finished.actualDailyConsumption).toBeCloseTo(90.91, 1);
      expect(finished.variancePercentage).toBeLessThan(-7.5);
      expect(finished.feedingStatus).toBe('underfeeding');
    });
  });
});

describe('Timezone-aware finish date', () => {
  useFixedTimeForTimezoneTests();

  it('uses the stored user timezone, not server time, for dateFinished', async () => {
    const { primary, testPet } = await setupUserAndPet();

    await UserPreferencesService.upsertUserPreferences(primary.id, {
      dateTimeLocale: 'en-US',
      unitSystem: 'imperial',
      timezone: 'Pacific/Kiritimati',
    });

    const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
    const serverUtcToday = toDateString(new Date());
    expect(usersToday).not.toBe(serverUtcToday);

    const dryFoodData = makeDryFoodData({
      bagWeight: '2.0',
      bagWeightUnit: 'kg',
      dailyAmount: '100',
      dateStarted: addCalendarDays(usersToday, -19),
    });

    const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
    const finished = await FoodService.markFoodAsFinished(testPet.id, created.id, primary.id);

    expect(finished.dateFinished).toBe(usersToday);
  });
});