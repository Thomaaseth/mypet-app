import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { FoodService } from '../../food.service';
import { BadRequestError, NotFoundError } from '../../../middleware/errors';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData, makeWetFoodData } from './helpers/factories';

describe('Update Operations', () => {
  describe('updateDryFoodEntry', () => {
    it('should update dry food entry with valid partial data', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({ brandName: 'Original Brand' }));

      const updated = await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { brandName: 'Updated Brand', dailyAmount: '150' });
      expect(updated.brandName).toBe('Updated Brand');
      expect(updated.dailyAmount).toBe('150.00');
    });

    it('should handle null/undefined brand and product names', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({ brandName: 'Original Brand' }));

      const updated = await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { brandName: '' });
      expect(updated.brandName).toBe(null);
    });

    it('should throw BadRequestError when no fields provided for update', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
      await expect(FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, {}))
        .rejects.toThrow('At least one field must be provided for update');
    });

    it('should throw NotFoundError when updating non-existent entry', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await expect(
        FoodService.updateDryFoodEntry(testPet.id, randomUUID(), primary.id, { brandName: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateWetFoodEntry', () => {
    it('should update wet food entry with valid partial data', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, makeWetFoodData({ brandName: 'Original Wet' }));

      const updated = await FoodService.updateWetFoodEntry(testPet.id, created.id, primary.id, { brandName: 'Updated Wet Brand', numberOfUnits: '24' });
      expect(updated.brandName).toBe('Updated Wet Brand');
      expect(updated.numberOfUnits).toBe(24);
    });

    it('should validate partial wet food data correctly', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, makeWetFoodData());
      await expect(
        FoodService.updateWetFoodEntry(testPet.id, created.id, primary.id, { numberOfUnits: 'invalid' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('Partial Update Validations', () => {
    it('should validate numeric fields in partial updates', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());

      await expect(
        FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { bagWeight: 'invalid' })
      ).rejects.toThrow(BadRequestError);

      await expect(
        FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { dailyAmount: '-50' })
      ).rejects.toThrow(BadRequestError);
    });

    it('should validate date formats in partial updates', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
      await expect(
        FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { datePurchased: 'invalid-date' })
      ).rejects.toThrow(BadRequestError);
    });
  });
});