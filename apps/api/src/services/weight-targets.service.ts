import { db } from '../db';
import { weightTargets } from '../db/schema/weight-targets';
import { eq } from 'drizzle-orm';
import type { WeightTarget, NewWeightTarget } from '../db/schema/weight-targets';
import { 
  BadRequestError, 
  NotFoundError,
} from '../middleware/errors';
import { PetsService } from './pets.service';
import { dbLogger } from '../lib/logger';
import { convertWeight } from '@/shared/utils/units';
import type { WeightTargetFormData } from '@/shared/validations/weight';


export class WeightTargetsService {
  // Verify pet ownership (reuse pattern from WeightEntriesService)
  private static async verifyPetOwnership(petId: string, userId: string): Promise<void> {
    try {
      await PetsService.getPetById(petId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Pet not found or access denied');
      }
      throw error;
    }
  }

  // Input validation helper
  private static validateInputs(targetData: WeightTargetFormData): void {
    // Required fields validation
    if (targetData.minWeight === undefined || targetData.maxWeight === undefined) {
      throw new BadRequestError('Both minimum and maximum target weight are required');
    }

    const minWeight = parseFloat(targetData.minWeight.toString());
    const maxWeight = parseFloat(targetData.maxWeight.toString());

    if (isNaN(minWeight) || isNaN(maxWeight)) {
      throw new BadRequestError('Target weight values must be valid numbers');
    }

    if (minWeight <= 0 || maxWeight <= 0) {
      throw new BadRequestError('Target weight values must be positive');
    }

    if (minWeight >= maxWeight) {
      throw new BadRequestError('Maximum target weight must be greater than minimum');
    }
  }

  // Business rules validation - ensure target is realistic for pet type
  private static validateBusinessRules(
    minWeightInKg: number,
    maxWeightInKg: number,
    pet: { animalType: string }
  ): void {
    const weightLimits = {
      cat: { min: 0.05, max: 15 },
      dog: { min: 0.5, max: 90 },
    };

    const limits = weightLimits[pet.animalType as keyof typeof weightLimits];

    if (minWeightInKg < limits.min || maxWeightInKg > limits.max) {
      throw new BadRequestError(
        `Target weight range is outside realistic range for ${pet.animalType} (${limits.min}-${limits.max}kg)`
      );
    }
  }

  // Get weight target for a pet
  static async getWeightTarget(petId: string, userId: string): Promise<WeightTarget | null> {
    try {
      // Verify pet ownership
      await this.verifyPetOwnership(petId, userId);

      const [target] = await db
        .select()
        .from(weightTargets)
        .where(eq(weightTargets.petId, petId));

      return target || null;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching weight target');
      throw new BadRequestError('Failed to fetch weight target');
    }
  }

  // Create or update weight target (upsert)
  static async upsertWeightTarget(
    petId: string, 
    userId: string, 
    targetData: WeightTargetFormData
  ): Promise<WeightTarget> {
    try {
      // Input validation
      this.validateInputs(targetData);
      
      // Authorization check
      const pet = await PetsService.getPetById(petId, userId);

      // Convert to canonical kg before validation and storage
      const minWeightInKg = convertWeight(parseFloat(targetData.minWeight.toString()), targetData.weightUnit, 'kg');
      const maxWeightInKg = convertWeight(parseFloat(targetData.maxWeight.toString()), targetData.weightUnit, 'kg');
     
      // Business rules validation
      this.validateBusinessRules(minWeightInKg, maxWeightInKg, pet);

      // Check if target already exists
      const existingTarget = await this.getWeightTarget(petId, userId);

      if (existingTarget) {
        // Update existing target
        const [updatedTarget] = await db
          .update(weightTargets)
          .set({
            minWeight: minWeightInKg.toFixed(2),
            maxWeight: maxWeightInKg.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(weightTargets.petId, petId))
          .returning();

        return updatedTarget;
      } else {
        // Create new target
        const [newTarget] = await db
          .insert(weightTargets)
          .values({
            petId,
            minWeight: minWeightInKg.toFixed(2),
            maxWeight: maxWeightInKg.toFixed(2),
          })
          .returning();

        return newTarget;
      }
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error upserting weight target');
      throw new BadRequestError('Failed to save weight target');
    }
  }

  // Delete weight target
  static async deleteWeightTarget(petId: string, userId: string): Promise<void> {
    try {
      // Verify pet ownership
      await this.verifyPetOwnership(petId, userId);

      // Check if target exists
      const existingTarget = await this.getWeightTarget(petId, userId);
      
      if (!existingTarget) {
        throw new NotFoundError('Weight target not found');
      }

      // Delete the target
      await db
        .delete(weightTargets)
        .where(eq(weightTargets.petId, petId));

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error deleting weight target');
      throw new BadRequestError('Failed to delete weight target');
    }
  }
}