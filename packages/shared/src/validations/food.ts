import { z } from 'zod';
import { convertFoodWeight } from '../utils/units';
import { key } from './i18n-keys';

// Base validation
const baseFoodValidation = {
  brandName: z.string().trim().max(100, key('food.validation.brandNameTooLong')).optional(),
  productName: z.string().trim().max(150, key('food.validation.productNameTooLong')).optional(),
  dailyAmount: z.string()
    .min(1, key('food.validation.dailyAmountRequired'))
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, key('food.validation.dailyAmountMustBePositive')),
    dateStarted: z.string()
    .min(1, key('food.validation.dateStartedRequired'))
    .refine((val) => !isNaN(new Date(val).getTime()), key('weights.validation.invalidDate')),
};

// bagWeightUnit is not user-selectable, derived from the user's unitSystem preference,
// travels as a hidden field (same pattern as weightEntryFormSchema.weightUnit).
// dailyAmount for dry food has no unit field: it's always grams, regardless of unitSystem.
// DRY FOOD VALIDATION
export const dryFoodSchema = z.object({
  ...baseFoodValidation,
  bagWeight: z.string()
    .min(1, key('food.validation.bagWeightRequired'))
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, key('food.validation.bagWeightMustBePositive')),
  bagWeightUnit: z.enum(['kg', 'lbs'], {
    required_error: key('food.validation.bagWeightUnitRequired'),
    invalid_type_error: key('food.validation.invalidBagWeightUnit')
  }),
}).strict().superRefine((data, ctx) => {
  const bagWeight = parseFloat(data.bagWeight.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));

  const bagWeightInGrams = convertFoodWeight(bagWeight, data.bagWeightUnit, 'grams');
  // dailyAmount is always grams for dry food — no conversion needed

  if (dailyAmount >= bagWeightInGrams) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: key('food.validation.dailyAmountExceedsBagWeight'),
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
    .min(1, key('food.validation.numberOfUnitsRequired'))
    .refine((val) => {
      const num = Number(val);
      return Number.isInteger(num) && num > 0;
    }, key('food.validation.numberOfUnitsMustBePositive')),
  weightPerUnit: z.string()
    .min(1, key('food.validation.weightPerUnitRequired'))
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, key('food.validation.weightPerUnitMustBePositive')),
  wetFoodUnit: z.enum(['grams', 'oz'], {
    required_error: key('food.validation.wetFoodUnitRequired'),
    invalid_type_error: key('food.validation.invalidWetFoodUnit')
  }),
}).strict().superRefine((data, ctx) => {
  const numberOfUnits = Number(data.numberOfUnits);
  const totalWeight = numberOfUnits * parseFloat(data.weightPerUnit.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));

  const totalWeightInGrams = convertFoodWeight(totalWeight, data.wetFoodUnit, 'grams');
  const dailyAmountInGrams = convertFoodWeight(dailyAmount, data.wetFoodUnit, 'grams');

  if (dailyAmountInGrams >= totalWeightInGrams) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: key('food.validation.dailyAmountExceedsTotalWeight'),
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
  }, key('food.validation.bagWeightMustBePositive')).optional(),
  bagWeightUnit: z.enum(['kg', 'lbs']).optional(),
  dailyAmount: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, key('food.validation.dailyAmountMustBePositive')).optional(),
  dateStarted: z.string().refine(val => {
    if (!val) return true;
    return !isNaN(new Date(val).getTime());
  }, key('weights.validation.invalidDate')).optional(),
}).strict().superRefine((data, ctx) => {
  if (data.bagWeight !== undefined && data.bagWeightUnit === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: key('food.validation.bagWeightUnitRequiredForUpdate'),
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
    }, key('food.validation.numberOfUnitsMustBePositive'))
    .optional(),
  weightPerUnit: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, key('food.validation.weightPerUnitMustBePositive')).optional(),
  wetFoodUnit: z.enum(['grams', 'oz']).optional(),
  dailyAmount: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val.replace(',', '.'));
    return !isNaN(num) && num > 0;
  }, key('food.validation.dailyAmountMustBePositive')).optional(),
  dateStarted: z.string().refine(val => {
    if (!val) return true;
    return !isNaN(new Date(val).getTime());
  }, key('weights.validation.invalidDate')).optional(),
}).strict().superRefine((data, ctx) => {
  // wetFoodUnit governs both weightPerUnit and dailyAmount; required if either changes
  if ((data.weightPerUnit !== undefined || data.dailyAmount !== undefined) && data.wetFoodUnit === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: key('food.validation.wetFoodUnitRequiredForUpdate'),
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