import { z } from 'zod';
import type { FoodType, FoodUnit } from '@/types/food';

// Base validation schema shared between food types
const baseFoodSchema = z.object({
  brandName: z.string().trim().max(100, 'Brand name must be 100 characters or less').optional(),
  productName: z.string().trim().max(150, 'Product name must be 150 characters or less').optional(),
  datePurchased: z.string()
    .min(1, 'Purchase date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Purchase date must be valid and not in the future'),
});

// Dry food specific validation
export const dryFoodSchema = baseFoodSchema.extend({
  foodType: z.literal('dry'),
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
  dailyAmount: z.string()
    .min(1, 'Daily amount is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number'),
  dailyAmountUnit: z.enum(['grams', 'cups'], {
    required_error: 'Daily amount unit is required',
    invalid_type_error: 'Invalid daily amount unit for dry food'
  }),
}).superRefine((data, ctx) => {
  // Cup decimal validation for dry food
  if (data.dailyAmountUnit === 'cups' && data.dailyAmount.includes('/')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please use decimals instead of fractions (e.g., 0.25 instead of 1/4)',
      path: ['dailyAmount']
    });
  }

  // Validate daily amount doesn't exceed bag weight (convert to same unit)
  const bagWeight = parseFloat(data.bagWeight.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
  
  // Convert bag weight to grams for comparison
  let bagWeightInGrams = bagWeight;
  if (data.bagWeightUnit === 'kg') {
    bagWeightInGrams = bagWeight * 1000;
  } else if (data.bagWeightUnit === 'pounds') {
    bagWeightInGrams = bagWeight * 453.592;
  }
  
  // Convert daily amount to grams for comparison
  let dailyAmountInGrams = dailyAmount;
  if (data.dailyAmountUnit === 'cups') {
    // Approximate conversion for dry food: 1 cup ≈ 100-120g (using 110g average)
    dailyAmountInGrams = dailyAmount * 110;
  }
  
  if (dailyAmountInGrams >= bagWeightInGrams) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Daily amount should be less than total bag weight',
      path: ['dailyAmount']
    });
  }
});

// Wet food specific validation
export const wetFoodSchema = baseFoodSchema.extend({
  foodType: z.literal('wet'),
  bagWeight: z.string()
    .min(1, 'Total weight is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Total weight must be a positive number'),
  bagWeightUnit: z.enum(['grams', 'oz'], {
    required_error: 'Total weight unit is required',
    invalid_type_error: 'Invalid weight unit for wet food'
  }),
  dailyAmount: z.string()
    .min(1, 'Daily amount is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number'),
  dailyAmountUnit: z.enum(['grams', 'oz'], {
    required_error: 'Daily amount unit is required',
    invalid_type_error: 'Invalid daily amount unit for wet food'
  }),
  numberOfUnits: z.string()
    .min(1, 'Number of units is required for wet food')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0;
    }, 'Number of units must be a positive number'),
  weightPerUnit: z.string()
    .min(1, 'Weight per unit is required for wet food')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Weight per unit must be a positive number'),
  weightPerUnitUnit: z.enum(['grams', 'oz'], {
    required_error: 'Weight per unit unit is required',
    invalid_type_error: 'Invalid weight per unit unit for wet food'
  }),
}).superRefine((data, ctx) => {
  // Validate calculated total weight matches input
  const numberOfUnits = parseInt(data.numberOfUnits);
  const weightPerUnit = parseFloat(data.weightPerUnit.replace(',', '.'));
  const inputTotalWeight = parseFloat(data.bagWeight.replace(',', '.'));
  
  if (!isNaN(numberOfUnits) && !isNaN(weightPerUnit) && !isNaN(inputTotalWeight)) {
    // Convert weight per unit to same unit as total weight for comparison
    let weightPerUnitConverted = weightPerUnit;
    
    if (data.weightPerUnitUnit !== data.bagWeightUnit) {
      if (data.weightPerUnitUnit === 'grams' && data.bagWeightUnit === 'oz') {
        weightPerUnitConverted = weightPerUnit / 28.3495; // grams to oz
      } else if (data.weightPerUnitUnit === 'oz' && data.bagWeightUnit === 'grams') {
        weightPerUnitConverted = weightPerUnit * 28.3495; // oz to grams
      }
    }
    
    const calculatedTotalWeight = numberOfUnits * weightPerUnitConverted;
    const tolerance = 0.1; // Allow 0.1 unit tolerance for rounding
    
    if (Math.abs(calculatedTotalWeight - inputTotalWeight) > tolerance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total weight should equal ${numberOfUnits} × ${weightPerUnit} ${data.weightPerUnitUnit} = ${calculatedTotalWeight.toFixed(1)} ${data.bagWeightUnit}`,
        path: ['bagWeight']
      });
    }
  }

  // Validate daily amount doesn't exceed total weight
  const totalWeight = parseFloat(data.bagWeight.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
  
  // Convert to same units for comparison
  const totalWeightConverted = totalWeight;
  let dailyAmountConverted = dailyAmount;
  
  if (data.bagWeightUnit !== data.dailyAmountUnit) {
    if (data.bagWeightUnit === 'grams' && data.dailyAmountUnit === 'oz') {
      dailyAmountConverted = dailyAmount * 28.3495; // oz to grams
    } else if (data.bagWeightUnit === 'oz' && data.dailyAmountUnit === 'grams') {
      dailyAmountConverted = dailyAmount / 28.3495; // grams to oz
    }
  }
  
  if (dailyAmountConverted >= totalWeightConverted) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Daily amount should be less than total weight',
      path: ['dailyAmount']
    });
  }
});

// Combined schema for dynamic validation
export const createFoodSchema = z.union([
  dryFoodSchema,
  wetFoodSchema
]);

// Update schema (allows partial updates)
export const updateFoodSchema = z.object({
  foodType: z.enum(['dry', 'wet']).optional(),
  brandName: z.string().trim().max(100).optional(),
  productName: z.string().trim().max(150).optional(),
  bagWeight: z.string().optional(),
  bagWeightUnit: z.enum(['kg', 'pounds', 'grams', 'cups', 'oz']).optional(),
  dailyAmount: z.string().optional(),
  dailyAmountUnit: z.enum(['grams', 'cups', 'oz']).optional(),
  numberOfUnits: z.string().optional(),
  weightPerUnit: z.string().optional(),
  weightPerUnitUnit: z.enum(['grams', 'oz']).optional(),
  datePurchased: z.string().optional(),
});

// Export types
export type DryFoodFormData = z.infer<typeof dryFoodSchema>;
export type WetFoodFormData = z.infer<typeof wetFoodSchema>;
export type FoodFormData = z.infer<typeof createFoodSchema>;
export type CreateFoodData = z.infer<typeof createFoodSchema>;
export type UpdateFoodData = z.infer<typeof updateFoodSchema>;

// Utility functions for validation
export const validateDryFood = (data: unknown) => {
  return dryFoodSchema.safeParse(data);
};

export const validateWetFood = (data: unknown) => {
  return wetFoodSchema.safeParse(data);
};

export const validateFoodForm = (data: unknown) => {
  return createFoodSchema.safeParse(data);
};

export const validateUpdateFood = (data: unknown) => {
  return updateFoodSchema.safeParse(data);
};

// Date formatting utility
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
};

// Weight/amount formatting utilities
export const formatAmount = (amount: string | null, unit: FoodUnit): string => {
  if (!amount) return 'Unknown';
  return `${amount} ${unit}`;
};

// Food type color helpers for UI consistency
export const getFoodTypeColor = (foodType: FoodType): string => {
  switch (foodType) {
    case 'dry':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'wet':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};