import { z } from 'zod';
import type { FoodType, FoodUnit } from '@/types/food';

const baseFoodFormSchema = z.object({
  foodType: z.enum(['dry', 'wet'], {
    required_error: 'Food type is required',
    invalid_type_error: 'Invalid food type'
  }),
  brandName: z.string().trim().max(100, 'Brand name must be 100 characters or less').optional(),
  productName: z.string().trim().max(150, 'Product name must be 150 characters or less').optional(),
  bagWeight: z.string()
    .min(1, 'Bag weight is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Bag weight must be a positive number'),
  bagWeightUnit: z.enum(['kg', 'pounds', 'grams', 'cups', 'oz'], {
    required_error: 'Bag weight unit is required'
  }),
  dailyAmount: z.string()
    .min(1, 'Daily amount is required')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'));
      return !isNaN(num) && num > 0;
    }, 'Daily amount must be a positive number'),
  dailyAmountUnit: z.enum(['grams', 'cups', 'oz'], {
    required_error: 'Daily amount unit is required'
  }),
  // Wet food specific fields
  numberOfUnits: z.string().optional(),
  weightPerUnit: z.string().optional(), 
  weightPerUnitUnit: z.enum(['kg', 'pounds', 'grams', 'cups', 'oz']).optional(),
  datePurchased: z.string()
    .min(1, 'Purchase date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Purchase date must be valid and not in the future'),
});

// Schema for creating a food entry
export const createFoodSchema = baseFoodFormSchema.superRefine((data, ctx) => {
  // Cup decimal validation
  if (data.dailyAmountUnit === 'cups' && data.dailyAmount.includes('/')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please use decimals instead of fractions (e.g., 0.25 instead of 1/4)',
      path: ['dailyAmount']
    });
  }

  // Wet food validation
  if (data.foodType === 'wet') {
    if (!data.numberOfUnits || data.numberOfUnits.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Number of units is required for wet food',
        path: ['numberOfUnits']
      });
    } else {
      const num = parseInt(data.numberOfUnits);
      if (isNaN(num) || num <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Number of units must be a positive number',
          path: ['numberOfUnits']
        });
      }
    }

    if (!data.weightPerUnit || data.weightPerUnit.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weight per unit is required for wet food',
        path: ['weightPerUnit']
      });
    } else {
      const num = parseFloat(data.weightPerUnit.replace(',', '.'));
      if (isNaN(num) || num <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Weight per unit must be a positive number',
          path: ['weightPerUnit']
        });
      }
    }

    if (!data.weightPerUnitUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weight per unit unit is required for wet food',
        path: ['weightPerUnitUnit']
      });
    }
  }

  // Validate that bag weight is greater than daily amount (when same units)
  const bagWeight = parseFloat(data.bagWeight.replace(',', '.'));
  const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
  
  if (data.bagWeightUnit === data.dailyAmountUnit && dailyAmount >= bagWeight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Daily amount should be less than total bag weight',
      path: ['dailyAmount']
    });
  }
});

// Schema for updating a food entry (more flexible)
export const updateFoodSchema = baseFoodFormSchema.partial().refine((data) => {
  // Only validate if both values are provided
  if (data.bagWeight && data.dailyAmount && data.bagWeightUnit === data.dailyAmountUnit) {
    const bagWeight = parseFloat(data.bagWeight.replace(',', '.'));
    const dailyAmount = parseFloat(data.dailyAmount.replace(',', '.'));
    
    if (dailyAmount >= bagWeight) {
      return false;
    }
  }
  
  return true;
}, {
  message: 'Daily amount should be less than total bag weight',
  path: ['dailyAmount']
});

// Export types
export type FoodFormData = z.infer<typeof createFoodSchema>;
export type CreateFoodData = z.infer<typeof createFoodSchema>;
export type UpdateFoodData = z.infer<typeof updateFoodSchema>;

// Utility functions for validation
export const validateFoodForm = (data: unknown) => {
  return createFoodSchema.safeParse(data);
};

export const validateUpdateFood = (data: unknown) => {
  return updateFoodSchema.safeParse(data);
};

// Date formatting utility (similar to weight validation)
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

// Unit conversion utilities (basic conversions)
export const convertWeight = (weight: number, fromUnit: FoodUnit, toUnit: FoodUnit): number => {
  if (fromUnit === toUnit) return weight;
  
  // Convert to grams first, then to target unit
  let weightInGrams: number;
  
  switch (fromUnit) {
    case 'grams':
      weightInGrams = weight;
      break;
    case 'pounds':
      weightInGrams = weight * 453.592;
      break;
    case 'cups':
      // Approximate conversion (1 cup ≈ 240g for dry food)
      weightInGrams = weight * 240;
      break;
    default:
      return weight;
  }
  
  switch (toUnit) {
    case 'grams':
      return weightInGrams;
    case 'pounds':
      return weightInGrams / 453.592;
    case 'cups':
      return weightInGrams / 240;
    default:
      return weight;
  }
};

// Calculate days remaining utility
export const calculateDaysRemaining = (bagWeight: string, dailyAmount: string, datePurchased: string): number => {
  const bag = parseFloat(bagWeight);
  const daily = parseFloat(dailyAmount);
  const purchaseDate = new Date(datePurchased);
  const today = new Date();
  
  if (isNaN(bag) || isNaN(daily) || daily <= 0) return 0;
  
  const daysSincePurchase = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
  const consumedWeight = Math.max(0, daysSincePurchase * daily);
  const remainingWeight = Math.max(0, bag - consumedWeight);
  
  return Math.floor(remainingWeight / daily);
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