import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { BadRequestError } from '../../../middleware/errors';
import { setupUserAndPet } from './helpers/setup';
import { makeWetFoodData, makeInvalidWetFoodData } from './helpers/factories';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import type { WetFoodFormData } from '../../../services/food';

describe('Wet Food Operations', () => {
  describe('createWetFoodEntry', () => {
    it('should create wet food entry with valid data', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const result = await FoodService.createWetFoodEntry(testPet.id, primary.id, makeWetFoodData());
      expect(result.numberOfUnits).toBe(12);
      expect(result.isActive).toBe(true);
    });

    it('should throw BadRequestError for invalid number of units', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await expect(
        FoodService.createWetFoodEntry(
          testPet.id,
          primary.id,
          makeInvalidWetFoodData({ numberOfUnits: 'invalid' }) as unknown as WetFoodFormData
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getWetFoodEntries', () => {
    it('should return all wet food entries for a pet', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await FoodService.createWetFoodEntry(testPet.id, primary.id, makeWetFoodData({ brandName: 'Wet Brand' }));
      const result = await FoodService.getWetFoodEntries(testPet.id, primary.id);
      expect(result.length).toBe(1);
      expect(result[0].foodType).toBe('wet');
    });
  });

  describe('updateWetFoodEntry', () => {
    it('should update wet food entry with valid data', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, makeWetFoodData());
      const result = await FoodService.updateWetFoodEntry(
        testPet.id,
        created.id,
        primary.id,
        { brandName: 'Updated Wet Brand' }
      );
      expect(result.brandName).toBe('Updated Wet Brand');
    });

    it('should validate fields during update', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, makeWetFoodData());
      await expect(
        FoodService.updateWetFoodEntry(
          testPet.id,
          created.id,
          primary.id,
          { numberOfUnits: 'invalid' } as unknown as WetFoodFormData
        )
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteWetFoodEntry', () => {
    it('should delete wet food entry successfully', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, makeWetFoodData());
      await FoodService.deleteFoodEntry(testPet.id, created.id, primary.id);
      const deletedEntry = await db.select().from(schema.foodEntries).where(eq(schema.foodEntries.id, created.id));
      expect(deletedEntry).toHaveLength(0);
    });
  });
});