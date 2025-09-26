import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { setupUserAndPet } from './helpers/setup';

describe('UUID Validation', () => {
  it('should throw BadRequestError for invalid foodId format', async () => {
    const { primary, testPet } = await setupUserAndPet();

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