import { z } from 'zod';
import { convertFoodWeight } from '../utils/units';

// Base validation
const baseFoodValidation = {
  brandName: z.string().trim().max(100, 'Brand name must be 100 characters or less').optional(),
  productName: z.string().trim().max(150, 'Product name must be 150 characters or less').optional(),
  dailyAmount: z.string()
    .min(1, 'Daily amount is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number'),
    dateStarted: z.string()
    .min(1, 'Purchase date is required')
    .refine((val) => !isNaN(new Date(val).getTime()), 'Please enter a valid date'),
};

// bagWeightUnit is not user-selectable, derived from the user's unitSystem preference,
// travels as a hidden field (same pattern as weightEntryFormSchema.weightUnit).
// dailyAmount for dry food has no unit field: it's always grams, regardless of unitSystem.
// DRY FOOD VALIDATION
export const dryFoodSchema = z.object({
  ...baseFoodValidation,
  bagWeight: z.string()
    .min(1, 'Bag weight is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Bag weight must be a positive number'),
  bagWeightUnit: z.enum(['kg', 'lbs'], {
    required_error: 'Bag weight unit is required',
    invalid_type_error: 'Invalid bag weight unit for dry food'
  }),
}).superRefine((data, ctx) => {
  const bagWeight = parseFloat(data.bagWeight.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));

  const bagWeightInGrams = convertFoodWeight(bagWeight, data.bagWeightUnit, 'grams');
  // dailyAmount is always grams for dry food — no conversion needed

  if (dailyAmount >= bagWeightInGrams) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Daily amount should be less than total bag weight',
      path: ['dailyAmount']
    });
  }
});

// wetFoodUnit is a single unit governing both weightPerUnit and dailyAmount — metric
// is always grams for both, imperial is always oz for both. Not user-selectable;
// derived from unitSystem, travels as a hidden field.
// WET FOOD VALIDATION
export const wetFoodSchema = z.object({
  ...baseFoodValidation,
  numberOfUnits: z.string()
    .min(1, 'Number of units is required')
    .refine((val) => {
      const num = Number(val);
      return Number.isInteger(num) && num > 0;
    }, 'Number of units must be a positive whole number'),
  weightPerUnit: z.string()
    .min(1, 'Weight per unit is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Weight per unit must be a positive number'),
  wetFoodUnit: z.enum(['grams', 'oz'], {
    required_error: 'Weight unit is required',
    invalid_type_error: 'Invalid weight unit for wet food'
  }),
}).superRefine((data, ctx) => {
  const numberOfUnits = parseInt(data.numberOfUnits, 10);
  const totalWeight = numberOfUnits * parseFloat(data.weightPerUnit.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));

  const totalWeightInGrams = convertFoodWeight(totalWeight, data.wetFoodUnit, 'grams');
  const dailyAmountInGrams = convertFoodWeight(dailyAmount, data.wetFoodUnit, 'grams');

  if (dailyAmountInGrams >= totalWeightInGrams) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Daily amount should be less than total weight',
      path: ['dailyAmount']
    });
  }
});

// PARTIAL UPDATE SCHEMAS
export const updateDryFoodSchema = z.object({
  brandName: z.string().trim().max(100).optional(),
  productName: z.string().trim().max(150).optional(),
  bagWeight: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Bag weight must be a positive number').optional(),
  bagWeightUnit: z.enum(['kg', 'lbs']).optional(),
  dailyAmount: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Daily amount must be a positive number').optional(),
  dateStarted: z.string().refine(val => {
    if (!val) return true;
    return !isNaN(new Date(val).getTime());
  }, 'Please enter a valid date').optional(),
}).superRefine((data, ctx) => {
  if (data.bagWeight !== undefined && data.bagWeightUnit === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Bag weight unit is required when updating bag weight',
      path: ['bagWeightUnit'],
    });
  }
});

export const updateWetFoodSchema = z.object({
  brandName: z.string().trim().max(100).optional(),
  productName: z.string().trim().max(150).optional(),
  numberOfUnits: z.string()
    .refine((val) => {
      if (!val) return true;
      const num = Number(val);
      return Number.isInteger(num) && num > 0;
    }, 'Number of units must be a positive whole number')
    .optional(),
  weightPerUnit: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Weight per unit must be a positive number').optional(),
  wetFoodUnit: z.enum(['grams', 'oz']).optional(),
  dailyAmount: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, 'Daily amount must be a positive number').optional(),
  dateStarted: z.string().refine(val => {
    if (!val) return true;
    return !isNaN(new Date(val).getTime());
  }, 'Please enter a valid date').optional(),
}).superRefine((data, ctx) => {
  // wetFoodUnit governs both weightPerUnit and dailyAmount; required if either changes
  if ((data.weightPerUnit !== undefined || data.dailyAmount !== undefined) && data.wetFoodUnit === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Weight unit is required when updating weight per unit or daily amount',
      path: ['wetFoodUnit'],
    });
  }
});

// Validate functions
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

// Export types
export type DryFoodFormData = z.infer<typeof dryFoodSchema>;
export type WetFoodFormData = z.infer<typeof wetFoodSchema>;
export type UpdateDryFoodData = z.infer<typeof updateDryFoodSchema>;
export type UpdateWetFoodData = z.infer<typeof updateWetFoodSchema>;