import { validateDryFoodData, validateWetFoodData, validateUpdateDryFoodData, validateUpdateWetFoodData } from '@/lib/validations/food';
import type { DryFoodFormData, WetFoodFormData } from '@/types/food';
import { ValidationError } from '../../errors';

export class FoodValidator {
  validateDryFoodData(data: unknown): DryFoodFormData {
    try {
      return validateDryFoodData(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message, 'validation');
      }
      throw new ValidationError('Dry food validation failed', 'validation');
    }
  }

  validateWetFoodData(data: unknown): WetFoodFormData {
    try {
      return validateWetFoodData(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message, 'validation');
      }
      throw new ValidationError('Wet food validation failed', 'validation');
    }
  }

  validateUpdateDryFoodData(data: unknown): Partial<DryFoodFormData> {
    try {
      return validateUpdateDryFoodData(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message, 'validation');
      }
      throw new ValidationError('Dry food update validation failed', 'validation');
    }
  }

  validateUpdateWetFoodData(data: unknown): Partial<WetFoodFormData> {
    try {
      return validateUpdateWetFoodData(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message, 'validation');
      }
      throw new ValidationError('Wet food update validation failed', 'validation');
    }
  }

  validateFoodId(foodId: string): string {
    if (!foodId || typeof foodId !== 'string' || foodId.trim().length === 0) {
      throw new ValidationError('Valid food ID is required', 'foodId');
    }
    return foodId.trim();
  }

  validatePetId(petId: string): string {
    if (!petId || typeof petId !== 'string' || petId.trim().length === 0) {
      throw new ValidationError('Valid pet ID is required', 'petId');
    }
    return petId.trim();
  }
}

// Default validator instance
export const foodValidator = new FoodValidator();