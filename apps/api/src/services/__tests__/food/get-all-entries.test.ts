import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData, makeWetFoodData } from './helpers/factories';

describe('getAllFoodEntries', () => {
  it('should return both dry and wet food entries', async () => {
    const { primary, testPet } = await setupUserAndPet();

    await FoodService.createDryFoodEntry(testPet.id, primary.id, {
      ...makeDryFoodData({ brandName: 'Dry Brand' }),
    });

    await FoodService.createWetFoodEntry(testPet.id, primary.id, {
      ...makeWetFoodData({ brandName: 'Wet Brand', datePurchased: '2024-01-02' }),
    });

    const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);

    expect(result).toHaveLength(2);

    const dryEntries = result.filter(entry => entry.foodType === 'dry');
    const wetEntries = result.filter(entry => entry.foodType === 'wet');

    expect(dryEntries).toHaveLength(1);
    expect(wetEntries).toHaveLength(1);

    expect(dryEntries[0].brandName).toBe('Dry Brand');
    expect(wetEntries[0].brandName).toBe('Wet Brand');
  });

  it('should return entries sorted by creation date (newest first)', async () => {
    const { primary, testPet } = await setupUserAndPet();

    const firstEntry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
      ...makeDryFoodData({ brandName: 'First Entry' }),
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const secondEntry = await FoodService.createWetFoodEntry(testPet.id, primary.id, {
      ...makeWetFoodData({ brandName: 'Second Entry' }),
    });

    const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(secondEntry.id);
    expect(result[1].id).toBe(firstEntry.id);
  });

  it('should return empty array when no food entries exist', async () => {
    const { primary, testPet } = await setupUserAndPet();
    const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);
    expect(result).toEqual([]);
  });

  it('should include both active and inactive entries', async () => {
    const { primary, testPet } = await setupUserAndPet();
  
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
  
    const dryFood = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
      bagWeight: '0.5',
      bagWeightUnit: 'kg',
      dailyAmount: '50',
      dryDailyAmountUnit: 'grams',
      datePurchased: pastDate.toISOString().split('T')[0],
    });
  
    // Explicitly mark the finished food as inactive
    await FoodService.markFoodAsFinished(testPet.id, dryFood.id, primary.id);
  
    await FoodService.createWetFoodEntry(testPet.id, primary.id, {
      numberOfUnits: '12',
      weightPerUnit: '85',
      wetWeightUnit: 'grams',
      dailyAmount: '50',
      wetDailyAmountUnit: 'grams',
      datePurchased: new Date().toISOString().split('T')[0],
    });
  
    const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);
  
    expect(result).toHaveLength(2);
  
    const activeEntries = result.filter(entry => entry.isActive);
    const inactiveEntries = result.filter(entry => !entry.isActive);
  
    expect(activeEntries).toHaveLength(1);
    expect(inactiveEntries).toHaveLength(1);
  });
});