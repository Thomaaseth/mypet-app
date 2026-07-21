import { validateWeightEntry, type WeightFormData } from '@/lib/validations/weight';
import type { WeightUnit } from '@/types/pet';

export class WeightValidator {
  validateWeightEntry(data: WeightFormData, weightUnit: WeightUnit, animalType: 'cat' | 'dog') {
    const result = validateWeightEntry(data, weightUnit, animalType);
    
    if (!result.success) {
      const firstError = result.error.errors[0];
      throw new Error(firstError.message);
    }
    
    return result.data;
  }

  validateWeightValue(weight: string, weightUnit: WeightUnit): number {
    const weightNum = parseFloat(weight);
    
    if (isNaN(weightNum) || weightNum <= 0) {
      throw new Error('Weight must be a positive number');
    }

    // Unit-specific validation
    if (weightUnit === 'kg' && weightNum > 200) {
      throw new Error('Weight cannot exceed 200kg');
    }
    
    if (weightUnit === 'lbs' && weightNum > 440) {
      throw new Error('Weight cannot exceed 440lbs');
    }

    return weightNum;
  }
}

// Default validator instance
export const weightValidator = new WeightValidator();