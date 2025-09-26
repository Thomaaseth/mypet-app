import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { FoodService } from '../../food';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodEntry, makeDryFoodData, makeInvalidDryFoodData, makeInvalidWetFoodData, makeWetFoodEntry } from './helpers/factories';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { BadRequestError } from '../../../middleware/errors';
import type { DryFoodFormData, WetFoodFormData } from '../../../services/food';

describe('Edge Cases and Error Scenarios', () => {
  describe('Zero and Negative Values', () => {
    it('should handle zero daily amount gracefully in calculations', async () => {
      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.00',
        bagWeightUnit: 'kg',
        dailyAmount: '0.00',
        dryDailyAmountUnit: 'grams',
        datePurchased: new Date().toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingDays).toBe(0);
      expect(result.remainingWeight).toBe(2.0);
    });

    it('should prevent negative remaining weight in calculations', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 100);

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '1.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100.00',
        dryDailyAmountUnit: 'grams',
        datePurchased: pastDate.toISOString().split('T')[0],
        isActive: false,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingWeight).toBeGreaterThanOrEqual(0);
      expect(result.remainingDays).toBe(0);
    });

    it('should handle very small decimal amounts correctly', async () => {
      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '0.01',
        bagWeightUnit: 'kg',
        dailyAmount: '1.00',
        dryDailyAmountUnit: 'grams',
        datePurchased: new Date().toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingDays).toBe(10);
      expect(result.remainingWeight).toBeCloseTo(0.01, 3);
    });
  });

  describe('Large Numbers and Precision', () => {
    it('should handle large bag weights correctly', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const largeBagData = makeDryFoodData({
        bagWeight: '50.00',
        bagWeightUnit: 'kg',
        dailyAmount: '200',
        dryDailyAmountUnit: 'grams',
        datePurchased: new Date().toISOString().split('T')[0],
      });

      const result = await FoodService.createDryFoodEntry(testPet.id, primary.id, largeBagData);

      const calculations = FoodService.calculateDryFoodRemaining(result);

      expect(calculations.remainingDays).toBe(250);
      expect(calculations.remainingWeight).toBe(50.0);
    });

    it('should maintain precision with decimal values', async () => {
      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.55',
        bagWeightUnit: 'kg',
        dailyAmount: '123.45',
        dryDailyAmountUnit: 'grams',
        datePurchased: new Date().toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingDays).toBe(20);
      expect(result.remainingWeight).toBeCloseTo(2.55, 2);
    });
  });

  describe('Date Edge Cases', () => {
    it('should handle same-day purchase correctly', async () => {
      const today = new Date();

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100.00',
        dryDailyAmountUnit: 'grams',
        datePurchased: today.toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingDays).toBe(20);
      expect(result.remainingWeight).toBe(2.0);
    });

    it('should handle future purchase dates gracefully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '2.00',
        bagWeightUnit: 'kg',
        dailyAmount: '100.00',
        dryDailyAmountUnit: 'grams',
        datePurchased: futureDate.toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingWeight).toBe(2.0);
      expect(result.remainingDays).toBe(20);
    });
  });

  describe('Database Constraint Validation', () => {
    it('should ignore wet food fields when creating dry food', async () => {    
      const { primary, testPet } = await setupUserAndPet();
    
      const result = await FoodService.createDryFoodEntry(
        testPet.id,
        primary.id,
        makeInvalidDryFoodData({
          numberOfUnits: '12',
          weightPerUnit: '85',
          wetWeightUnit: 'grams',
          wetDailyAmountUnit: 'grams',
        }) as unknown as DryFoodFormData
      );
    
      // Should succeed and create valid dry food entry
      expect(result.foodType).toBe('dry');
      expect(result.bagWeight).toBe('2.00');
      expect(result.bagWeightUnit).toBe('kg');
      
      // Wet food fields should be null (ignored)
      expect(result.numberOfUnits).toBeNull();
      expect(result.weightPerUnit).toBeNull();
      expect(result.wetWeightUnit).toBeNull();
      expect(result.wetDailyAmountUnit).toBeNull();
    });
    
    it('should ignore dry food fields when creating wet food', async () => {    
      const { primary, testPet } = await setupUserAndPet();
    
      const result = await FoodService.createWetFoodEntry(
        testPet.id,
        primary.id,
        makeInvalidWetFoodData({
          bagWeight: '2.0',
          bagWeightUnit: 'kg',
          dryDailyAmountUnit: 'grams',
        }) as unknown as WetFoodFormData
      );
    
      // Should succeed and create valid wet food entry
      expect(result.foodType).toBe('wet');
      expect(result.numberOfUnits).toBe(12);
      expect(result.wetWeightUnit).toBe('grams');
      
      // Dry food fields should be null (ignored)  
      expect(result.bagWeight).toBeNull();
      expect(result.bagWeightUnit).toBeNull();
      expect(result.dryDailyAmountUnit).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent updates to same food entry', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
  
      const update1Promise = FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { brandName: 'Brand A' });
      const update2Promise = FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { productName: 'Product B' });
  
      const results = await Promise.allSettled([update1Promise, update2Promise]);
  
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('fulfilled');
    });
  
    it('should handle concurrent calculation operations', async () => {
      const { primary, testPet } = await setupUserAndPet();
  
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
  
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({
        bagWeight: '1.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        datePurchased: pastDate.toISOString().split('T')[0],
      }));
  
      // Test concurrent calculations (these are pure functions, no database operations)
      const promises = Array.from({ length: 3 }, () => FoodService.calculateDryFoodRemaining(created));
  
      const results = await Promise.all(promises);
  
      // All calculations should return the same results
      results.forEach(result => {
        expect(result.remainingDays).toBe(0); // Food should be finished after 30 days
        expect(result.remainingWeight).toBe(0);
      });
  
      // Verify the original entry is still active (calculations don't modify database)
      const fetched = await FoodService.getDryFoodEntryById(testPet.id, created.id, primary.id);
      expect(fetched.isActive).toBe(true);
    });

    it('should handle concurrent markFoodAsFinished operations', async () => {
      const { primary, testPet } = await setupUserAndPet();
    
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
    
      // Try to mark as finished concurrently
      const promises = Array.from({ length: 3 }, () => 
        FoodService.markFoodAsFinished(testPet.id, created.id, primary.id)
      );
    
      const results = await Promise.allSettled(promises);
    
      // Only one should succeed, others should fail (already marked as finished)
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
    
      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(2);
    
      if (successful[0].status === 'fulfilled') {
        expect(successful[0].value.isActive).toBe(false);
      }
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle multiple food entries efficiently', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const createPromises = Array.from({ length: 10 }, (_, i) => {
        const dryFoodData = makeDryFoodData({ brandName: `Brand ${i}` });
        return FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
      });

      await Promise.all(createPromises);

      const startTime = Date.now();
      const allEntries = await FoodService.getAllFoodEntries(testPet.id, primary.id);
      const endTime = Date.now();

      expect(allEntries).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data integrity during failed operations', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());

      try {
        await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { bagWeight: 'invalid-number' });
      } catch (error) {
        // expected
      }

      const unchanged = await FoodService.getDryFoodEntryById(testPet.id, created.id, primary.id);
      expect(unchanged.bagWeight).toBe('2.00');
      expect(unchanged.bagWeightUnit).toBe('kg');
    });

    it('should handle orphaned food entries correctly', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());

      await db.update(schema.pets)
        .set({ isActive: false })
        .where(eq(schema.pets.id, testPet.id));

      await expect(
        FoodService.getDryFoodEntries(testPet.id, primary.id)
      ).rejects.toThrow(Error);
    });
  });

  describe('Unit Conversion Edge Cases', () => {
    it('should handle very small unit conversions accurately', async () => {
      const wetFoodEntry = makeWetFoodEntry({
        numberOfUnits: 1,
        weightPerUnit: '0.01',
        wetWeightUnit: 'oz',
        dailyAmount: '0.005',
        wetDailyAmountUnit: 'oz',
        datePurchased: new Date().toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);

      expect(result.remainingDays).toBe(2);
      expect(result.remainingWeight).toBeCloseTo(0.01, 3);
    });

    it('should handle mixed unit systems correctly', async () => {
      const dryFoodEntry = makeDryFoodEntry({
        bagWeight: '1.00',
        bagWeightUnit: 'pounds',
        dailyAmount: '50.00',
        dryDailyAmountUnit: 'grams',
        datePurchased: new Date().toISOString().split('T')[0],
        isActive: true,
      });

      const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);

      expect(result.remainingDays).toBe(9);
      expect(result.remainingWeight).toBeCloseTo(1.0, 2);
    });
  });
});