import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodEntry, makeWetFoodEntry, makeDryFoodData } from './helpers/factories';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';

describe('Business Logic Calculations', () => {
  describe('calculateDryFoodRemaining', () => {
    it('should calculate remaining days correctly for active dry food', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 5); // 5 days ago

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100.00',
        dryDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      // After 5 days at 100g/day, 500g consumed, 1500g remaining
      // 1500g / 100g per day = 15 days remaining
      expect(result.remainingDays).toBe(15);
      expect(result.remainingWeight).toBeCloseTo(1.5, 2);
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

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingDays).toBe(0);
      expect(result.remainingWeight).toBe(0);
    });
  });

  describe('calculateWetFoodRemaining', () => {
    it('should calculate remaining days correctly for active wet food', async () => {
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - 3); // 3 days ago

      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 12,
        weightPerUnit: '85.00',
        wetWeightUnit: 'grams',
        dailyAmount: '170.00',
        wetDailyAmountUnit: 'grams',
        dateStarted: purchaseDate.toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);

      // Total: 12 × 85g = 1020g
      // After 3 days at 170g/day: 510g consumed, 510g remaining
      // 510g / 170g per day = 3 days remaining
      expect(result.remainingDays).toBe(3);
      expect(result.remainingWeight).toBeCloseTo(510, 1);
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

      const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);

      // Total: 6 × 3oz = 18oz
      // After 1 day at 6oz/day: 6oz consumed, 12oz remaining
      // 12oz / 6oz per day = 2 days remaining
      expect(result.remainingDays).toBe(2);
      expect(result.remainingWeight).toBeCloseTo(12, 1);
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
  
      const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);
  
      // 10 units × 100g = 1000g total
      // 10oz daily = 283.495g daily (10 × 28.3495)
      // Day 1: 283.495g consumed, 716.505g remaining
      // 716.505g / 283.495g per day = 2.52... -> 2 days remaining
      expect(result.remainingDays).toBe(2);
      expect(result.remainingWeight).toBeCloseTo(716.505, 1); // remaining in grams
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
  
      const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);
  
      // 10 units × 1oz = 10oz = 283.495g total (10 × 28.3495)
      // 50g daily
      // Day 1: 50g consumed, 233.495g remaining
      // 233.495g / 50g per day = 4.66... -> 4 days remaining
      expect(result.remainingDays).toBe(4);
      expect(result.remainingWeight).toBeCloseTo(8.24, 2); // 233.495g = 8.24oz
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
      const calculations = FoodService.calculateDryFoodRemaining(created);
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

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      const expectedDepletionDate = new Date();
      expectedDepletionDate.setDate(today.getDate() + 15);

      expect(result.remainingDays).toBe(15);
      expect(result.depletionDate.toDateString()).toBe(expectedDepletionDate.toDateString());
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

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      const expectedDepletionDate = new Date(purchaseDate);
      expectedDepletionDate.setDate(purchaseDate.getDate() + 20);

      expect(result.remainingDays).toBe(0);
      expect(result.depletionDate.toDateString()).toBe(expectedDepletionDate.toDateString());
    });
  });
});
