import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { BadRequestError } from '../../../middleware/errors';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData, makeInvalidDryFoodData } from './helpers/factories';
import type { DryFoodFormData } from '../../../services/food';

describe('Dry Food Operations', () => {
  describe('createDryFoodEntry', () => {
    it('should create dry food entry with valid data', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const result = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
      expect(result.bagWeight).toBe('2.00');
      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestError when required fields are missing', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await expect(
        FoodService.createDryFoodEntry(testPet.id, primary.id, { brandName: 'Test Brand' } as unknown as DryFoodFormData)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for invalid bag weight unit', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await expect(
        FoodService.createDryFoodEntry(
          testPet.id, 
          primary.id, 
          makeInvalidDryFoodData({ bagWeightUnit: 'invalid_unit' }) as unknown as DryFoodFormData
        )
      ).rejects.toThrow('Invalid bag weight unit');
    });

    it('should throw BadRequestError for future purchase date', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      await expect(
        FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({ datePurchased: futureDate }))
      ).rejects.toThrow('Purchase date cannot be in the future');
    });
  });

  describe('getDryFoodEntries', () => {
    it('should return all dry food entries for a pet', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({ brandName: 'Brand A' }));
      await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({ brandName: 'Brand B' }));
      const result = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      expect(result.length).toBe(2);
    });
  });

  describe('updateDryFoodEntry', () => {
    it('should update dry food entry with valid data', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
      const result = await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { brandName: 'Updated Brand' });
      expect(result.brandName).toBe('Updated Brand');
    });
  });

  describe('deleteDryFoodEntry', () => {
    it('should delete dry food entry successfully', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
      await FoodService.deleteFoodEntry(testPet.id, created.id, primary.id);
      const deletedEntry = await db.select().from(schema.foodEntries).where(eq(schema.foodEntries.id, created.id));
      expect(deletedEntry).toHaveLength(0);
    });
  });
});