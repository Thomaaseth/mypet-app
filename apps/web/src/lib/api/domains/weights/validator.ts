import { validateWeightEntry, type WeightFormData } from '@/lib/validations/weight';
import type { WeightUnit } from '@/types/pet';

export class WeightValidator {
  validateWeightEntry(data: WeightFormData, weightUnit: WeightUnit) {
    const result = validateWeightEntry(data, weightUnit);
    
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

  validateDate(date: string): Date {
    const parsedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format');
    }
    
    if (parsedDate > today) {
      throw new Error('Date cannot be in the future');
    }
    
    return parsedDate;
  }
}

// Default validator instance
export const weightValidator = new WeightValidator();