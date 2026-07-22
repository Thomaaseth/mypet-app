import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { db } from '../../../db';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { BadRequestError } from '../../../middleware/errors';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData, makeInvalidDryFoodData } from './helpers/factories';
import type { DryFoodFormData } from '../../../services/food';
import { UserPreferencesService } from '../../user-preferences.service';
import { addCalendarDays, toDateString } from '@/shared/utils/dates';
import { useFixedTimeForTimezoneTests } from '../../../test/timezone-test-utils';

describe('Dry Food Operations', () => {
  describe('createDryFoodEntry', () => {
    it('should create dry food entry with valid data', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const result = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData());
      expect(result.bagWeight).toBe('1995.80'); // canonical grams (factory default: 4.4 lbs)
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
        FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({ dateStarted: futureDate }))
      ).rejects.toThrow('Purchase date cannot be in the future');
    });
    
    it('rejects a purchase date one day past the stored-timezone user\'s own "today"', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateTimeLocale: 'en-US',
        unitSystem: 'imperial',
        timezone: 'Pacific/Kiritimati',
      });

      const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
      const oneDayPastUsersToday = addCalendarDays(usersToday, 1);

      await expect(
        FoodService.createDryFoodEntry(
          testPet.id,
          primary.id,
          makeDryFoodData({ dateStarted: oneDayPastUsersToday })
        )
      ).rejects.toThrow('Purchase date cannot be in the future');
    });

    describe('timezone-aware purchase date validation', () => {
      useFixedTimeForTimezoneTests();

      it('uses the stored user timezone, not server time, when validating purchase date', async () => {
        const { primary, testPet } = await setupUserAndPet();

        await UserPreferencesService.upsertUserPreferences(primary.id, {
          dateTimeLocale: 'en-US',
          unitSystem: 'imperial',
          timezone: 'Pacific/Kiritimati',
        });

        const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
        const serverUtcToday = toDateString(new Date());
        expect(usersToday).not.toBe(serverUtcToday);

        const result = await FoodService.createDryFoodEntry(
          testPet.id,
          primary.id,
          makeDryFoodData({ dateStarted: usersToday })
        );

        expect(result.dateStarted).toBe(usersToday);
      });
    });
  });

  describe('getDryFoodEntries', () => {
    it('should return active dry food entries for a pet', async () => {
      const { primary, testPet } = await setupUserAndPet();
      
      // Create first entry
      const firstEntry = await FoodService.createDryFoodEntry(testPet.id, primary.id, makeDryFoodData({ brandName: 'Brand A' }));
      
      // Should return 1 active entry
      const result = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      expect(result.length).toBe(1);
      expect(result[0].brandName).toBe('Brand A');
      expect(result[0].isActive).toBe(true);
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

describe('createDryFoodEntry - unit conversion', () => {
    it('should convert bagWeight from lbs to canonical grams on write', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const result = await FoodService.createDryFoodEntry(
        testPet.id,
        primary.id,
        makeDryFoodData({ bagWeight: '5', bagWeightUnit: 'lbs' })
      );

      // 5 lbs × 453.592 = 2267.96g
      expect(result.bagWeight).toBe('2267.96');
    });

    it('should convert bagWeight from kg to canonical grams on write', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const result = await FoodService.createDryFoodEntry(
        testPet.id,
        primary.id,
        makeDryFoodData({ bagWeight: '3', bagWeightUnit: 'kg' })
      );

      // 3 kg × 1000 = 3000g
      expect(result.bagWeight).toBe('3000.00');
    });
  });
