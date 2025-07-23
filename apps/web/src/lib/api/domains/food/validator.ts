import { createFoodSchema, updateFoodSchema } from '@/lib/validations/food';
import type { FoodFormData } from '@/types/food';

export class FoodValidator {
  validateCreateFood(data: unknown): FoodFormData {
    const result = createFoodSchema.safeParse(data);
    
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    
    return result.data;
  }

  validateUpdateFood(data: unknown): Partial<FoodFormData> {
    const result = updateFoodSchema.safeParse(data);
    
    if (!result.success) {
      const errorMessage = result.error.errors.map(err => err.message).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    
    return result.data;
  }

  validateFoodId(foodId: string): string {
    if (!foodId || typeof foodId !== 'string' || foodId.trim().length === 0) {
      throw new Error('Valid food ID is required');
    }
    return foodId.trim();
  }

  validatePetId(petId: string): string {
    if (!petId || typeof petId !== 'string' || petId.trim().length === 0) {
      throw new Error('Valid pet ID is required');
    }
    return petId.trim();
  }
}

// Default validator instance
export const foodValidator = new FoodValidator();