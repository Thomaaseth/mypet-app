import { z } from 'zod';
import type { WeightUnit } from './pet';
import { key } from './i18n-keys';

// Per-animal healthy weight range, in kg. Exported so the same numbers
// power both the Zod validation (below) and the UI's error-message
// interpolation (the specific min/max/unit shown to the user)
const ANIMAL_WEIGHT_LIMITS_KG = {
  cat: { min: 0.05, max: 15 },
  dog: { min: 0.5, max: 90 },
} as const;

const KG_TO_LB = 2.20462;

export function getAnimalWeightLimits(
  animalType: 'cat' | 'dog',
  displayUnit: WeightUnit
): { min: number; max: number } {
  const limitsKg = ANIMAL_WEIGHT_LIMITS_KG[animalType];
  if (displayUnit === 'kg') {
    return limitsKg;
  }
  return {
    min: Number((limitsKg.min * KG_TO_LB).toFixed(1)),
    max: Number((limitsKg.max * KG_TO_LB).toFixed(1)),
  };
}

// Base weight entry validation schema
export const weightEntryFormSchema = z.object({
  weight: z
    .string()
    .min(1, key('weights.validation.weightRequired'))
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, key('weights.validation.weightMustBePositive')),
  weightUnit: z.enum(['kg', 'lbs'], {
    errorMap: () => ({ message: key('weights.validation.invalidWeightUnit') })
  }),
  date: z.string()
    .min(1, key('weights.validation.dateRequired'))
    .refine((val) => !isNaN(new Date(val).getTime()), key('weights.validation.invalidDate')),
  });

  // Schema for partial updates — enforces weightUnit must accompany weight if weight is being changed
  export const updateWeightEntrySchema = weightEntryFormSchema.partial().superRefine((data, ctx) => {
    if (data.weight !== undefined && data.weightUnit === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: key('weights.validation.weightUnitRequiredForUpdate'),
        path: ['weightUnit'],
      });
    }
  });

export const weightTargetSchema = z.object({
  minWeight: z.string()
    .min(1, key('weights.validation.minWeightRequired'))
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
  }, key('weights.validation.minWeightMustBePositive')),
    maxWeight: z.string()
    .min(1, key('weights.validation.maxWeightRequired'))
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
  }, key('weights.validation.maxWeightMustBePositive')),
    weightUnit: z.enum(['kg', 'lbs'], {
    errorMap: () => ({ message: key('weights.validation.invalidWeightUnit') }),
  }),
}).refine((data) => {
  const min = parseFloat(data.minWeight);
  const max = parseFloat(data.maxWeight);
  return max > min;
}, {
  message: key('weights.validation.maxMustExceedMin'),
  path: ['maxWeight'],
});

// Enhanced validation with unit-specific weight limits
export const createWeightEntrySchema = (
  _weightUnit: WeightUnit, // kept for API compatibility, schema uses data.weightUnit internally
  animalType: 'cat' | 'dog'
) => {
  return weightEntryFormSchema.refine((data) => {
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight <= 0) return false;
 
    // Convert to kg for validation (use data.weightUnit)
    const weightInKg = data.weightUnit === 'kg' ? weight : weight / KG_TO_LB;
 
    const animalLimits = ANIMAL_WEIGHT_LIMITS_KG[animalType];
 
    // Check animal-specific limits
    if (weightInKg < animalLimits.min || weightInKg > animalLimits.max) {
      return false;
    }
 
    // Check absolute maximum
    if (weightInKg > 200) {
      return false;
    }
    
    return true;
  }, (data) => {
    const weight = parseFloat(data.weight);
    const weightInKg = data.weightUnit === 'kg' ? weight : weight / KG_TO_LB;
 
    // Determine which limit was violated. Message is a translation key only —
    // the interpolation values (min/max/unit/animalType) are recomputed at
    // render time from `getAnimalWeightLimits`, not embedded here.
    if (weightInKg > 200) {
      return {
        message: key('weights.validation.absoluteMaxExceeded'),
        path: ['weight']
      };
    }
 
    return {
      message: key('weights.validation.outOfAnimalRange'),
      path: ['weight']
    };
  });
};

export const createWeightTargetSchema = (animalType: 'cat' | 'dog') => {
  const animalLimits = ANIMAL_WEIGHT_LIMITS_KG[animalType];
 
  return weightTargetSchema.refine((data) => {
    const minInKg = data.weightUnit === 'kg'
      ? parseFloat(data.minWeight)
      : parseFloat(data.minWeight) / KG_TO_LB;
    const maxInKg = data.weightUnit === 'kg'
      ? parseFloat(data.maxWeight)
      : parseFloat(data.maxWeight) / KG_TO_LB;
 
    return minInKg >= animalLimits.min && maxInKg <= animalLimits.max;
  }, {
    message: key('weights.validation.targetOutOfAnimalRange'),
    path: ['maxWeight'],
  });
};

// Export types
export type WeightFormData = z.infer<typeof weightEntryFormSchema>;
export type WeightTargetFormData = z.infer<typeof weightTargetSchema>;
export type UpdateWeightEntryData = z.infer<typeof updateWeightEntrySchema>;

// Validate functions
export const validateWeightEntry = (
  data: unknown, 
  _weightUnit: WeightUnit, 
  animalType: 'cat' | 'dog'
) => {
  const schema = createWeightEntrySchema(_weightUnit, animalType);
  return schema.safeParse(data);
};

