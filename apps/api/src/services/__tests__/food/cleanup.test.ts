import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food.service';
import { setupUserAndPet } from './helpers/setup';

describe('Cleanup Mechanism Tests', () => {
  describe('cleanupFinishedEntries', () => {
    it('should keep max 5 inactive entries per food type', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const createPromises = Array.from({ length: 7 }, async (_, i) => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - (30 + i));

        const dryFoodData = {
          brandName: `Finished Brand ${i}`,
          bagWeight: '0.5',
          bagWeightUnit: 'kg',
          dailyAmount: '100',
          dryDailyAmountUnit: 'grams',
          datePurchased: pastDate.toISOString().split('T')[0],
        } as const;

        const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
        await FoodService.processEntryForResponse(entry);
        return entry;
      });

      await Promise.all(createPromises);

      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveEntries = allEntries.filter(entry => !entry.isActive);

      expect(inactiveEntries).toHaveLength(5);
    });

    it('should keep most recently updated inactive entries', async () => {
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

      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const remainingInactive = allEntries.filter(entry => !entry.isActive);

      expect(remainingInactive).toHaveLength(5);

      const remainingBrands = remainingInactive.map(e => e.brandName).sort();
      expect(remainingBrands).toEqual(['Entry 2', 'Entry 3', 'Entry 4', 'Entry 5', 'Entry 6']);
    });

    it('should not cleanup when there are 5 or fewer inactive entries', async () => {
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

      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveEntries = allEntries.filter(entry => !entry.isActive);

      expect(inactiveEntries).toHaveLength(3);
      expect(inactiveEntries.every(e => e.brandName?.startsWith('Keep Entry'))).toBe(true);
    });

    it('should cleanup dry and wet food independently', async () => {
      const { primary, testPet } = await setupUserAndPet();

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

      const dryEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveDryEntries = dryEntries.filter(entry => !entry.isActive);
      expect(inactiveDryEntries).toHaveLength(5);

      const wetEntries = await FoodService.getWetFoodEntries(testPet.id, primary.id);
      const inactiveWetEntries = wetEntries.filter(entry => !entry.isActive);
      expect(inactiveWetEntries).toHaveLength(5);
    });

    it('should handle concurrent cleanup operations safely', async () => {
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

      const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
      const inactiveEntries = allEntries.filter(entry => !entry.isActive);

      expect(inactiveEntries).toHaveLength(5);
    });

    it('should not affect active entries during cleanup', async () => {
      const { primary, testPet } = await setupUserAndPet();

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

      expect(activeEntries).toHaveLength(2);
      expect(inactiveEntries).toHaveLength(5);

      const activeBrands = activeEntries.map(e => e.brandName);
      expect(activeBrands).toEqual(expect.arrayContaining(['Active 1', 'Active 2']));
    });
  });
});
