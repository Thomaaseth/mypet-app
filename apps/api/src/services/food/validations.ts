import { BadRequestError } from '../../middleware/errors';
import type { DryFoodFormData, WetFoodFormData } from './types';

export class FoodValidations {
  static validateCommonInputs(data: { dateStarted?: string; brandName?: string; productName?: string }): void {
    // Date format validation
    if (data.dateStarted !== undefined) {
      const purchaseDate = new Date(data.dateStarted);
      if (isNaN(purchaseDate.getTime())) {
        throw new BadRequestError('Invalid date format for purchase date');
      }

      // Future date validation
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (purchaseDate > today) {
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

  static validateDryFoodInputs(data: Partial<DryFoodFormData>, isUpdate = false): void {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!data.bagWeight || !data.bagWeightUnit || !data.dailyAmount || !data.dryDailyAmountUnit || !data.dateStarted) {
        throw new BadRequestError('Bag weight, bag weight unit, daily amount, daily amount unit, and purchase date are required for dry food');
      }
    }

    // Validate bag weight unit
    if (data.bagWeightUnit !== undefined && !['kg', 'pounds'].includes(data.bagWeightUnit)) {
      throw new BadRequestError('Invalid bag weight unit for dry food. Must be kg or pounds');
    }

    // Validate daily amount unit
    if (data.dryDailyAmountUnit !== undefined && !['grams', 'cups'].includes(data.dryDailyAmountUnit)) {
      throw new BadRequestError('Invalid daily amount unit for dry food. Must be grams or cups');
    }

    // Validate numeric values
    if (data.bagWeight !== undefined) {
      const bagWeight = parseFloat(data.bagWeight);
      if (isNaN(bagWeight) || bagWeight <= 0) {
        throw new BadRequestError('Bag weight must be a positive number');
      }

    // Unit-specific upper limits
    if (data.bagWeightUnit === 'kg' && bagWeight > 50) {
      throw new BadRequestError('Bag weight seems unreasonably large (max 50kg)');
    }
    if (data.bagWeightUnit === 'pounds' && bagWeight > 110) { // ~50kg
      throw new BadRequestError('Bag weight seems unreasonably large (max 110 pounds)');
    }
    }

    if (data.dailyAmount !== undefined) {
      const dailyAmount = parseFloat(data.dailyAmount);
      if (isNaN(dailyAmount) || dailyAmount <= 0) {
        throw new BadRequestError('Daily amount must be a positive number');
      }
      // Reasonable upper limits based on unit
      if (data.dryDailyAmountUnit === 'grams' && dailyAmount > 2000) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 2000 grams)');
      }
      if (data.dryDailyAmountUnit === 'cups' && dailyAmount > 16) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 16 cups)');
      }
    }

    // Validate common fields
    this.validateCommonInputs(data);
  }

  static validateWetFoodInputs(data: Partial<WetFoodFormData>, isUpdate = false): void {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!data.numberOfUnits || !data.weightPerUnit || !data.wetWeightUnit || 
          !data.dailyAmount || !data.wetDailyAmountUnit || !data.dateStarted) {
        throw new BadRequestError('Number of units, weight per unit, weight unit, daily amount, daily amount unit, and purchase date are required for wet food');
      }
    }

    // Validate weight units
    if (data.wetWeightUnit !== undefined && !['grams', 'oz'].includes(data.wetWeightUnit)) {
      throw new BadRequestError('Invalid weight unit for wet food. Must be grams or oz');
    }

    if (data.wetDailyAmountUnit !== undefined && !['grams', 'oz'].includes(data.wetDailyAmountUnit)) {
      throw new BadRequestError('Invalid daily amount unit for wet food. Must be grams or oz');
    }

    // Validate numeric values
    if (data.numberOfUnits !== undefined) {
      const numberOfUnits = parseInt(data.numberOfUnits, 10);
      if (!Number.isInteger(numberOfUnits) || numberOfUnits <= 0 || isNaN(numberOfUnits)) {
        throw new BadRequestError('Number of units must be a positive integer');
      }
      if (numberOfUnits > 100) { // Reasonable upper limit
        throw new BadRequestError('Number of units seems unreasonably large (max 100)');
      }
    }

    if (data.weightPerUnit !== undefined) {
      const weightPerUnit = parseFloat(data.weightPerUnit);
      if (isNaN(weightPerUnit) || weightPerUnit <= 0) {
        throw new BadRequestError('Weight per unit must be a positive number');
      }
      // Reasonable upper limits based on unit
      if (data.wetWeightUnit === 'grams' && weightPerUnit > 5000) {
        throw new BadRequestError('Weight per unit seems unreasonably large (max 5000 grams)');
      }
      if (data.wetWeightUnit === 'oz' && weightPerUnit > 176) { // ~5000g
        throw new BadRequestError('Weight per unit seems unreasonably large (max 176 oz)');
      }
    }

    if (data.dailyAmount !== undefined) {
      const dailyAmount = parseFloat(data.dailyAmount);
      if (isNaN(dailyAmount) || dailyAmount <= 0) {
        throw new BadRequestError('Daily amount must be a positive number');
      }
      // Reasonable upper limits based on unit
      if (data.wetDailyAmountUnit === 'grams' && dailyAmount > 2000) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 2000 grams)');
      }
      if (data.wetDailyAmountUnit === 'oz' && dailyAmount > 70) { // ~2000g
        throw new BadRequestError('Daily amount seems unreasonably large (max 70 oz)');
      }
    }

    // Validate common fields
    this.validateCommonInputs(data);
  }

  static validateUUID(id: string, fieldName: string = 'ID'): void {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestError(`Invalid ${fieldName} format`);
    }
  }
}