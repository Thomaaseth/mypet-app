import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { BadRequestError, NotFoundError } from '../../middleware/errors';
import { FoodService } from '../food.service';
import { db } from '../../db';
import { DatabaseTestUtils } from '../../test/database-test-utils';
import type { DryFoodFormData, WetFoodFormData } from '../food.service';

describe('FoodService', () => {
  describe('Dry Food Operations', () => {
    describe('createDryFoodEntry', () => {
      it('should create dry food entry with valid data', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const dryFoodData: DryFoodFormData = {
          brandName: 'Test Brand',
          productName: 'Test Food',
          bagWeight: '2.0',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        const result = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

        expect(result.bagWeight).toBe('2.00');
        expect(result.bagWeightUnit).toBe('kg');
        expect(result.dailyAmount).toBe('100.00');
        expect(result.isActive).toBe(true);
      });

      it('should throw BadRequestError when required fields are missing', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const invalidData: Partial<DryFoodFormData> = {
          brandName: 'Test Brand',
          // Missing required fields
        };

        await expect(
          FoodService.createDryFoodEntry(testPet.id, primary.id, invalidData as DryFoodFormData)
        ).rejects.toThrow(BadRequestError);
      });

      it('should throw BadRequestError for invalid bag weight unit', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const invalidData = {
          brandName: 'Test Brand',
          productName: 'Test Food',
          bagWeight: '2.0',
          bagWeightUnit: 'invalid_unit',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        await expect(
          FoodService.createDryFoodEntry(testPet.id, primary.id, invalidData as any)
        ).rejects.toThrow('Invalid bag weight unit');
      });

      it('should throw BadRequestError for future purchase date', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const futureDate = tomorrow.toISOString().split('T')[0];
        
        const invalidData: DryFoodFormData = {
          brandName: 'Test Brand',
          productName: 'Test Food',
          bagWeight: '2.0',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: futureDate,
        };

        await expect(
          FoodService.createDryFoodEntry(testPet.id, primary.id, invalidData)
        ).rejects.toThrow('Purchase date cannot be in the future');
      });
    });

    describe('getDryFoodEntries', () => {
      it('should return all dry food entries for a pet', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        // Create multiple dry food entries
        const dryFoodData1: DryFoodFormData = {
          brandName: 'Brand A',
          productName: 'Food A',
          bagWeight: '2.0',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        const dryFoodData2: DryFoodFormData = {
          brandName: 'Brand B',
          productName: 'Food B',
          bagWeight: '1.5',
          bagWeightUnit: 'kg',
          dailyAmount: '80',
          dryDailyAmountUnit: 'grams',
          datePurchased: '2024-01-05',
        };

        await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData1);
        await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData2);

        const result = await FoodService.getDryFoodEntries(testPet.id, primary.id);

        expect(result.length).toBe(2);
        expect(result.some(entry => entry.brandName === 'Brand A')).toBe(true);
        expect(result.some(entry => entry.brandName === 'Brand B')).toBe(true);
      });
    });

    describe('updateDryFoodEntry', () => {
      it('should update dry food entry with valid data', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const dryFoodData: DryFoodFormData = {
          brandName: 'Original Brand',
          productName: 'Original Food',
          bagWeight: '2.0',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

        const updateData: Partial<DryFoodFormData> = {
          brandName: 'Updated Brand',
          dailyAmount: '120',
        };

        const result = await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, updateData);

        expect(result.brandName).toBe('Updated Brand');
        expect(result.dailyAmount).toBe('120.00');
        expect(result.productName).toBe('Original Food'); // Should remain unchanged
      });
    });

    describe('deleteDryFoodEntry', () => {
      it('should delete dry food entry successfully', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const dryFoodData: DryFoodFormData = {
          brandName: 'Test Brand',
          productName: 'Test Food',
          bagWeight: '2.0',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

        await FoodService.deleteFoodEntry(testPet.id, created.id, primary.id);

        // Verify it's deleted from database
        const deletedEntry = await db.select()
          .from(schema.foodEntries)
          .where(eq(schema.foodEntries.id, created.id));

        expect(deletedEntry).toHaveLength(0);
      });
    });
  });

  describe('Wet Food Operations', () => {
    describe('createWetFoodEntry', () => {
      it('should create wet food entry with valid data', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const wetFoodData: WetFoodFormData = {
          brandName: 'Wet Brand',
          productName: 'Wet Food',
          numberOfUnits: '12',
          weightPerUnit: '85',
          wetWeightUnit: 'grams',
          dailyAmount: '170',
          wetDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        const result = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);

        expect(result.numberOfUnits).toBe(12);
        expect(result.weightPerUnit).toBe('85.00');
        expect(result.wetWeightUnit).toBe('grams');
        expect(result.isActive).toBe(true);
      });

      it('should throw BadRequestError for invalid number of units', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const invalidData = {
          brandName: 'Wet Brand',
          productName: 'Wet Food',
          numberOfUnits: 'invalid',
          weightPerUnit: '85',
          wetWeightUnit: 'grams',
          dailyAmount: '170',
          wetDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        await expect(
          FoodService.createWetFoodEntry(testPet.id, primary.id, invalidData as any)
        ).rejects.toThrow(BadRequestError);
      });
    });

    describe('getWetFoodEntries', () => {
      it('should return all wet food entries for a pet', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
        const wetFoodData: WetFoodFormData = {
          brandName: 'Wet Brand',
          productName: 'Wet Food',
          numberOfUnits: '12',
          weightPerUnit: '85',
          wetWeightUnit: 'grams',
          dailyAmount: '170',
          wetDailyAmountUnit: 'grams',
          datePurchased: '2024-01-01',
        };

        await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);

        const result = await FoodService.getWetFoodEntries(testPet.id, primary.id);

        expect(result.length).toBe(1);
        expect(result[0].brandName).toBe('Wet Brand');
        expect(result[0].foodType).toBe('wet');
      });
    });
  });

  describe('UUID Validation', () => {
    it('should throw BadRequestError for invalid foodId format', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);

      await expect(
        FoodService.getDryFoodEntryById(testPet.id, 'invalid-food-id', primary.id)
      ).rejects.toThrow('Invalid food entry ID format');

      await expect(
        FoodService.updateDryFoodEntry(testPet.id, 'invalid-food-id', primary.id, { brandName: 'New Brand' })
      ).rejects.toThrow('Invalid food entry ID format');

      await expect(
        FoodService.deleteFoodEntry(testPet.id, 'invalid-food-id', primary.id)
      ).rejects.toThrow('Invalid food entry ID format');
    });
  });

  describe('Security and Authorization', () => {
    it('should prevent unauthorized access to food entries', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      
      const foodData: DryFoodFormData = {
        brandName: 'Test Brand',
        productName: 'Test Food',
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        datePurchased: '2024-01-01',
      };

      await expect(
        FoodService.createDryFoodEntry(otherUserPet.id, primary.id, foodData)
      ).rejects.toThrow(NotFoundError);

      await expect(
        FoodService.getDryFoodEntries(otherUserPet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should prevent access to inactive pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [inactivePet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Inactive Pet',
        animalType: 'cat',
        isActive: false,
      }).returning();

      const foodData: DryFoodFormData = {
        brandName: 'Test Brand',
        productName: 'Test Food',
        bagWeight: '2.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        datePurchased: '2024-01-01',
      };

      await expect(
        FoodService.createDryFoodEntry(inactivePet.id, primary.id, foodData)
      ).rejects.toThrow(NotFoundError);
    });
  });
});