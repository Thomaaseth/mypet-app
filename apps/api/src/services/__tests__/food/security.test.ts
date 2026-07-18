import { describe, it, expect } from 'vitest';
import { FoodService } from '../../food';
import { db } from '../../../db';
import * as schema from '../../../db/schema';
import { NotFoundError } from '../../../middleware/errors';
import { setupUserAndPet } from './helpers/setup';
import { makeDryFoodData } from './helpers/factories';

describe('Security and Authorization', () => {
  it('should prevent unauthorized access to food entries', async () => {
    const { primary, secondary } = await setupUserAndPet();
    const [otherUserPet] = await db.insert(schema.pets).values({
      userId: secondary.id,
      name: 'Other Pet',
      animalType: 'cat',
      isActive: true,
    }).returning();

    await expect(
      FoodService.createDryFoodEntry(otherUserPet.id, primary.id, makeDryFoodData())
    ).rejects.toThrow(NotFoundError);

    await expect(
      FoodService.getDryFoodEntries(otherUserPet.id, primary.id)
    ).rejects.toThrow(NotFoundError);
  });

  it('should prevent access to inactive pets', async () => {
    const { primary } = await setupUserAndPet();
    const [inactivePet] = await db.insert(schema.pets).values({
      userId: primary.id,
      name: 'Inactive Pet',
      animalType: 'cat',
      isActive: false,
    }).returning();

    await expect(
      FoodService.createDryFoodEntry(inactivePet.id, primary.id, makeDryFoodData())
    ).rejects.toThrow(NotFoundError);
  });

  it('should report NotFoundError, not a validation error, when both authorization and payload are invalid', async () => {
    const { primary, secondary } = await setupUserAndPet();
    const [otherUserPet] = await db.insert(schema.pets).values({
      userId: secondary.id,
      name: 'Other Pet',
      animalType: 'cat',
      isActive: true,
    }).returning();

    // Ownership check now runs before validation (see FoodService.createDryFoodEntry) —
    // an unauthorized caller should get NotFoundError even with a garbage payload,
    // not a BadRequestError that would leak "at least your payload shape was checked"
    await expect(
      FoodService.createDryFoodEntry(otherUserPet.id, primary.id, {
        bagWeight: 'not-a-number',
        bagWeightUnit: 'invalid_unit',
        dailyAmount: 'also-not-a-number',
        dateStarted: 'not-a-date',
      } as unknown as Parameters<typeof FoodService.createDryFoodEntry>[2])
    ).rejects.toThrow(NotFoundError);
  });
});