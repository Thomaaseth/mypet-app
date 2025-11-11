import { ValidationError } from '../../errors';
import type { WeightTargetFormData } from '@/types/weight-targets';

export class WeightTargetValidator {
  validateWeightTargetData(
    targetData: Partial<WeightTargetFormData>
  ): void {
    // Required fields
    if (targetData.minWeight === undefined || targetData.minWeight === '') {
      throw new ValidationError('Minimum weight is required', 'minWeight');
    }

    if (targetData.maxWeight === undefined || targetData.maxWeight === '') {
      throw new ValidationError('Maximum weight is required', 'maxWeight');
    }

    if (!targetData.weightUnit) {
      throw new ValidationError('Weight unit is required', 'weightUnit');
    }

    // Parse values
    const minWeight = parseFloat(targetData.minWeight);
    const maxWeight = parseFloat(targetData.maxWeight);

    // Check if values are valid numbers
    if (isNaN(minWeight)) {
      throw new ValidationError('Minimum weight must be a valid number', 'minWeight');
    }

    if (isNaN(maxWeight)) {
      throw new ValidationError('Maximum weight must be a valid number', 'maxWeight');
    }

    // Must be positive
    if (minWeight <= 0) {
      throw new ValidationError('Minimum weight must be positive', 'minWeight');
    }

    if (maxWeight <= 0) {
      throw new ValidationError('Maximum weight must be positive', 'maxWeight');
    }

    // Max must be greater than min
    if (minWeight >= maxWeight) {
      throw new ValidationError(
        'Maximum weight must be greater than minimum weight',
        'maxWeight'
      );
    }
  }

  transformWeightTargetData(
    targetData: Partial<WeightTargetFormData>
  ): Partial<WeightTargetFormData> {
    return {
      minWeight: targetData.minWeight?.trim(),
      maxWeight: targetData.maxWeight?.trim(),
      weightUnit: targetData.weightUnit,
    };
  }
}

export const weightTargetValidator = new WeightTargetValidator();