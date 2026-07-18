import { BadRequestError } from '../../middleware/errors';
import type { DryFoodFormData, WetFoodFormData } from './types';
import { convertFoodWeight } from '@/shared/utils/units';

export class FoodValidations {
  static validateCommonInputs(
    data: { dateStarted?: string; brandName?: string; productName?: string },
    today: string
  ): void {
    // Date format validation
    if (data.dateStarted !== undefined) {
      if (isNaN(new Date(data.dateStarted).getTime())) {
        throw new BadRequestError('Invalid date format for purchase date');
      }

      // Future date validation — plain string comparison against the
      // user's own "today" (per getTodayForUser), same pattern as
      // updateFinishDate. No Date object arithmetic, no local-timezone
      // exposure 
      if (data.dateStarted > today) {
        throw new BadRequestError('Purchase date cannot be in the future');
      }
    }

    // Optional string length validation
    if (data.brandName && data.brandName.length > 100) {
      throw new BadRequestError('Brand name must be 100 characters or less');
    }
    if (data.productName && data.productName.length > 100) {
      throw new BadRequestError('Product name must be 100 characters or less');
    }
  }

  static validateDryFoodInputs(data: Partial<DryFoodFormData>, today: string, isUpdate = false): void {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!data.bagWeight || !data.bagWeightUnit || !data.dailyAmount || !data.dateStarted) {
        throw new BadRequestError('Bag weight, bag weight unit, daily amount, and purchase date are required for dry food');
      }
    }

    if (data.bagWeightUnit !== undefined && !['kg', 'lbs'].includes(data.bagWeightUnit)) {
      throw new BadRequestError('Invalid bag weight unit for dry food. Must be kg or lbs');
    }

     if (data.bagWeight !== undefined) {
      const bagWeight = parseFloat(data.bagWeight);
      if (isNaN(bagWeight) || bagWeight <= 0) {
        throw new BadRequestError('Bag weight must be a positive number');
      }

      if (data.bagWeightUnit === undefined) {
        throw new BadRequestError('Bag weight unit is required when updating bag weight');
      }

      const bagWeightInGrams = convertFoodWeight(bagWeight, data.bagWeightUnit, 'grams');
      if (bagWeightInGrams > 50000) {
        throw new BadRequestError(
          `Bag weight seems unreasonably large (max 50kg / ${convertFoodWeight(50000, 'grams', 'lbs').toFixed(1)}lbs)`
        );
      }
    }

    if (data.dailyAmount !== undefined) {
      const dailyAmount = parseFloat(data.dailyAmount);
      if (isNaN(dailyAmount) || dailyAmount <= 0) {
        throw new BadRequestError('Daily amount must be a positive number');
      }
      // Reasonable upper limit for grams
      if (dailyAmount > 2000) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 2000 grams)');
      }
    }

    // Validate common fields
    this.validateCommonInputs(data, today);
  }

  static validateWetFoodInputs(data: Partial<WetFoodFormData>, today: string, isUpdate = false): void {
    if (!isUpdate) {
      if (!data.numberOfUnits || !data.weightPerUnit || !data.wetFoodUnit || !data.dailyAmount || !data.dateStarted) {
        throw new BadRequestError('Number of units, weight per unit, weight unit, daily amount, and purchase date are required for wet food');
      }
    }
    if (data.wetFoodUnit !== undefined && !['grams', 'oz'].includes(data.wetFoodUnit)) {
      throw new BadRequestError('Invalid weight unit for wet food. Must be grams or oz');
    }

    if (data.numberOfUnits !== undefined) {
      const numberOfUnits = parseInt(data.numberOfUnits, 10);
      if (!Number.isInteger(numberOfUnits) || numberOfUnits <= 0 || isNaN(numberOfUnits)) {
        throw new BadRequestError('Number of units must be a positive integer');
      }
      if (numberOfUnits > 100) {
        throw new BadRequestError('Number of units seems unreasonably large (max 100)');
      }
    }

    if (data.weightPerUnit !== undefined) {
      const weightPerUnit = parseFloat(data.weightPerUnit);
      if (isNaN(weightPerUnit) || weightPerUnit <= 0) {
        throw new BadRequestError('Weight per unit must be a positive number');
      }
      if (data.wetFoodUnit === undefined) {
        throw new BadRequestError('Weight unit is required when updating weight per unit');
      }
      const weightPerUnitInGrams = convertFoodWeight(weightPerUnit, data.wetFoodUnit, 'grams');
      if (weightPerUnitInGrams > 5000) {
        throw new BadRequestError('Weight per unit seems unreasonably large (max 5000 grams / 176.4oz)');
      }
    }
    if (data.dailyAmount !== undefined) {
      const dailyAmount = parseFloat(data.dailyAmount);
      if (isNaN(dailyAmount) || dailyAmount <= 0) {
        throw new BadRequestError('Daily amount must be a positive number');
      }
      if (data.wetFoodUnit === undefined) {
        throw new BadRequestError('Weight unit is required when updating daily amount');
      }
      const dailyAmountInGrams = convertFoodWeight(dailyAmount, data.wetFoodUnit, 'grams');
      if (dailyAmountInGrams > 2000) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 2000 grams / 70.5oz)');
      }
    }

    this.validateCommonInputs(data, today);
  }
}