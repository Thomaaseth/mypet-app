import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food.service';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData } from './helpers/factories';

describe('Food Service - Business Logic Tests', () => {
  describe('Status Updates and Frontend API', () => {
    it('should mark all entries as inactive and limit frontend results to 5', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const createPromises = Array.from({ length: 7 }, async (_, i) => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - (30 + i));

        const dryFoodData = makeDryFoodData({brandName: `Finished Brand ${i}` });
        const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
        await FoodService.processEntryForResponse(entry);
        return entry;
      });

      await Promise.all(createPromises);

      // All 7 entries should be marked inactive (no automatic cleanup)
      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveEntries = allEntries.filter(entry => !entry.isActive);
      expect(inactiveEntries).toHaveLength(7);

      // But frontend API should limit to 5
      const finishedEntries = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry');
      expect(finishedEntries).toHaveLength(5);
    });

    it('should keep most recently updated inactive entries in frontend API', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const entries = [];
      for (let i = 0; i < 7; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);

        const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
          brandName: `Entry ${i}`,
          bagWeight: '0.5',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        });

        entries.push(entry);

        await new Promise(resolve => setTimeout(resolve, 10));
        await FoodService.processEntryForResponse(entry);
      }

      // All 7 should be inactive in database
      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const remainingInactive = allEntries.filter(entry => !entry.isActive);
      expect(remainingInactive).toHaveLength(7);

      // But frontend API should return only 5 most recent
      const finishedEntries = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry');
      expect(finishedEntries).toHaveLength(5);

      const remainingBrands = finishedEntries.map(e => e.brandName).sort();
      expect(remainingBrands).toEqual(['Entry 2', 'Entry 3', 'Entry 4', 'Entry 5', 'Entry 6']);
    });

    it('should show all entries when there are 5 or fewer inactive entries', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const createPromises = Array.from({ length: 3 }, async (_, i) => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);

        const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
          brandName: `Keep Entry ${i}`,
          bagWeight: '0.5',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        });

        await FoodService.processEntryForResponse(entry);
        return entry;
      });

      await Promise.all(createPromises);

      // Database should have all 3
      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveEntries = allEntries.filter(entry => !entry.isActive);
      expect(inactiveEntries).toHaveLength(3);

      // Frontend API should also show all 3 (since <= 5)
      const finishedEntries = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry');
      expect(finishedEntries).toHaveLength(3);
      expect(finishedEntries.every(e => e.brandName?.startsWith('Keep Entry'))).toBe(true);
    });

    it('should handle dry and wet food independently in frontend API', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Create 7 dry food entries
      for (let i = 0; i < 7; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);

        const dryEntry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
          brandName: `Dry ${i}`,
          bagWeight: '0.5',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        });

        await FoodService.processEntryForResponse(dryEntry);
      }

      // Create 7 wet food entries
      for (let i = 0; i < 7; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);

        const wetEntry = await FoodService.createWetFoodEntry(testPet.id, primary.id, {
          brandName: `Wet ${i}`,
          numberOfUnits: '2',
          weightPerUnit: '85',
          wetWeightUnit: 'grams',
          dailyAmount: '170',
          wetDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        });

        await FoodService.processEntryForResponse(wetEntry);
      }

      // Database should have all 14 inactive entries
      const dryEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveDryEntries = dryEntries.filter(entry => !entry.isActive);
      expect(inactiveDryEntries).toHaveLength(7);

      const wetEntries = await FoodService.getWetFoodEntries(testPet.id, primary.id);
      const inactiveWetEntries = wetEntries.filter(entry => !entry.isActive);
      expect(inactiveWetEntries).toHaveLength(7);

      // Frontend API should limit each food type to 5
      const finishedDryEntries = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry');
      expect(finishedDryEntries).toHaveLength(5);

      const finishedWetEntries = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'wet');
      expect(finishedWetEntries).toHaveLength(5);
    });

    it('should handle concurrent status updates without race conditions', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const entries = [];
      for (let i = 0; i < 8; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);

        const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
          brandName: `Concurrent ${i}`,
          bagWeight: '0.5',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        });

        entries.push(entry);
      }

      const processPromises = entries.map(entry => FoodService.processEntryForResponse(entry));
      await Promise.all(processPromises);

      // All 8 should be inactive (no automatic cleanup means no race conditions)
      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveEntries = allEntries.filter(entry => !entry.isActive);
      expect(inactiveEntries).toHaveLength(8);

      // Frontend API should limit to 5
      const finishedEntries = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry');
      expect(finishedEntries).toHaveLength(5);
    });

    it('should not affect active entries during status updates', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Create 2 active entries (large bags that won't finish)
      await FoodService.createDryFoodEntry(testPet.id, primary.id, {
        brandName: 'Active 1',
        bagWeight: '5.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        datePurchased: new Date().toISOString().split('T')[0],
      });

      await FoodService.createDryFoodEntry(testPet.id, primary.id, {
        brandName: 'Active 2',
        bagWeight: '5.0',
        bagWeightUnit: 'kg',
        dailyAmount: '100',
        dryDailyAmountUnit: 'grams',
        datePurchased: new Date().toISOString().split('T')[0],
      });

      // Create 7 finished entries
      for (let i = 0; i < 7; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);

        const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
          brandName: `Finished ${i}`,
          bagWeight: '0.5',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        });

        await FoodService.processEntryForResponse(entry);
      }

      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const activeEntries = allEntries.filter(entry => entry.isActive);
      const inactiveEntries = allEntries.filter(entry => !entry.isActive);

      // Should have 2 active entries (unaffected) + 7 inactive entries (all preserved)
      expect(activeEntries).toHaveLength(2);
      expect(inactiveEntries).toHaveLength(7);

      const activeBrands = activeEntries.map(e => e.brandName);
      expect(activeBrands).toEqual(expect.arrayContaining(['Active 1', 'Active 2']));

      // Frontend API should still limit inactive entries to 5
      const finishedEntries = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry');
      expect(finishedEntries).toHaveLength(5);
    });

    it('should support custom limits in getFinishedFoodEntries', async () => {
      const { primary, testPet } = await setupUserAndPet();

      // Create 10 inactive entries
      for (let i = 0; i < 10; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - (30 + i));

        const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
          brandName: `Custom ${i}`,
          bagWeight: '0.5',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        });

        await FoodService.processEntryForResponse(entry);
      }

      // Default limit (5)
      const defaultFinished = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry');
      expect(defaultFinished).toHaveLength(5);

      // Custom limit of 3
      const limitedFinished = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry', 3);
      expect(limitedFinished).toHaveLength(3);

      // Custom limit of 15 (should return all 10)
      const allFinished = await FoodService.getFinishedFoodEntries(testPet.id, primary.id, 'dry', 15);
      expect(allFinished).toHaveLength(10);
    });
  });
});