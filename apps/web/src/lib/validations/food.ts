// apps/web/src/lib/validations/food.ts
import { z } from 'zod';

// 🎯 SEPARATE VALIDATION SCHEMAS - NO UNIONS

// Base validation for common fields
const baseFoodValidation = {
  brandName: z.string().trim().max(100, 'Brand name must be 100 characters or less').optional(),
  productName: z.string().trim().max(150, 'Product name must be 150 characters or less').optional(),
  dailyAmount: z.string()
    .min(1, 'Daily amount is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number'),
  datePurchased: z.string()
    .min(1, 'Purchase date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Purchase date must be valid and not in the future'),
};

// 🎯 DRY FOOD VALIDATION
export const dryFoodSchema = z.object({
  ...baseFoodValidation,
  bagWeight: z.string()
    .min(1, 'Bag weight is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Bag weight must be a positive number'),
  bagWeightUnit: z.enum(['kg', 'pounds'], {
    required_error: 'Bag weight unit is required',
    invalid_type_error: 'Invalid bag weight unit for dry food'
  }),
  dryDailyAmountUnit: z.enum(['grams', 'cups'], {
    required_error: 'Daily amount unit is required',
    invalid_type_error: 'Invalid daily amount unit for dry food'
  }),
}).superRefine((data, ctx) => {
  // Validate daily amount doesn't exceed bag weight (basic sanity check)
  const bagWeight = parseFloat(data.bagWeight.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
  
  // Simple check - daily amount shouldn't be more than total bag weight
  if (dailyAmount >= bagWeight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Daily amount should be less than total bag weight',
      path: ['dailyAmount']
    });
  }

  // Cup decimal validation for dry food
  if (data.dryDailyAmountUnit === 'cups' && data.dailyAmount.includes('/')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please use decimals instead of fractions (e.g., 0.25 instead of 1/4)',
      path: ['dailyAmount']
    });
  }
});

// 🎯 WET FOOD VALIDATION
export const wetFoodSchema = z.object({
  ...baseFoodValidation,
  numberOfUnits: z.number()
    .int('Number of units must be a whole number')
    .positive('Number of units must be greater than 0'),
  weightPerUnit: z.string()
    .min(1, 'Weight per unit is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Weight per unit must be a positive number'),
  wetWeightUnit: z.enum(['grams', 'oz'], {
    required_error: 'Weight unit is required',
    invalid_type_error: 'Invalid weight unit for wet food'
  }),
  wetDailyAmountUnit: z.enum(['grams', 'oz'], {
    required_error: 'Daily amount unit is required',
    invalid_type_error: 'Invalid daily amount unit for wet food'
  }),
}).superRefine((data, ctx) => {
  // Calculate total weight for validation
  const totalWeight = data.numberOfUnits * parseFloat(data.weightPerUnit.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
  
  // Convert to same units for comparison if needed
  let dailyAmountConverted = dailyAmount;
  if (data.wetWeightUnit !== data.wetDailyAmountUnit) {
    if (data.wetWeightUnit === 'grams' && data.wetDailyAmountUnit === 'oz') {
      dailyAmountConverted = dailyAmount * 28.3495; // oz to grams
    } else if (data.wetWeightUnit === 'oz' && data.wetDailyAmountUnit === 'grams') {
      dailyAmountConverted = dailyAmount / 28.3495; // grams to oz
    }
  }
  
  if (dailyAmountConverted >= totalWeight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Daily amount should be less than total weight',
      path: ['dailyAmount']
    });
  }
});

// 🎯 PARTIAL UPDATE SCHEMAS
export const updateDryFoodSchema = z.object({
  brandName: z.string().trim().max(100).optional(),
  productName: z.string().trim().max(150).optional(),
  bagWeight: z.string().refine(val => {
    if (!val) return true; // Allow empty for partial updates
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Bag weight must be a positive number').optional(),
  bagWeightUnit: z.enum(['kg', 'pounds']).optional(),
  dailyAmount: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Daily amount must be a positive number').optional(),
  dryDailyAmountUnit: z.enum(['grams', 'cups']).optional(),
  datePurchased: z.string().refine(val => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, 'Invalid date or date cannot be in the future').optional(),
});

export const updateWetFoodSchema = z.object({
  brandName: z.string().trim().max(100).optional(),
  productName: z.string().trim().max(150).optional(),
  numberOfUnits: z.number().int().positive().optional(),
  weightPerUnit: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Weight per unit must be a positive number').optional(),
  wetWeightUnit: z.enum(['grams', 'oz']).optional(),
  dailyAmount: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Daily amount must be a positive number').optional(),
  wetDailyAmountUnit: z.enum(['grams', 'oz']).optional(),
  datePurchased: z.string().refine(val => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  }, 'Invalid date or date cannot be in the future').optional(),
});

// 🎯 HELPER FUNCTIONS
export function validateDryFoodData(data: unknown) {
  const result = dryFoodSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`Dry food validation failed: ${errorMessage}`);
  }
  return result.data;
}

export function validateWetFoodData(data: unknown) {
  const result = wetFoodSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`Wet food validation failed: ${errorMessage}`);
  }
  return result.data;
}

export function validateUpdateDryFoodData(data: unknown) {
  const result = updateDryFoodSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`Dry food update validation failed: ${errorMessage}`);
  }
  return result.data;
}

export function validateUpdateWetFoodData(data: unknown) {
  const result = updateWetFoodSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`Wet food update validation failed: ${errorMessage}`);
  }
  return result.data;
}

// 🎯 DATE HELPER
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};