import { z } from 'zod';
import type { WeightUnit } from './pet';

// Base weight entry validation schema
export const weightEntryFormSchema = z.object({
  weight: z
    .string()
    .min(1, 'Weight is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Weight must be a positive number'),
  weightUnit: z.enum(['kg', 'lbs'], {
    errorMap: () => ({ message: 'Please select a valid weight unit' })
  }),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      
      // Check if it's a valid date and not in the future
      return !isNaN(parsedDate.getTime()) && parsedDate <= today;
    }, 'Date cannot be in the future'),
});

export const weightTargetSchema = z.object({
  minWeight: z.string()
    .min(1, 'Minimum weight is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Minimum weight must be a positive number'),
  maxWeight: z.string()
    .min(1, 'Maximum weight is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Maximum weight must be a positive number'),
  weightUnit: z.enum(['kg', 'lbs'], {
    errorMap: () => ({ message: 'Please select a valid weight unit' }),
  }),
}).refine((data) => {
  const min = parseFloat(data.minWeight);
  const max = parseFloat(data.maxWeight);
  return max > min;
}, {
  message: 'Maximum weight must be greater than minimum weight',
  path: ['maxWeight'],
});

// Enhanced validation with unit-specific weight limits
export const createWeightEntrySchema = (
  _weightUnit: WeightUnit, // kept for API compatibility, schema uses data.weightUnit internally
  animalType: 'cat' | 'dog'
) => {
  // Animal-specific limits (defined outside for reuse)
  const limits = {
    cat: { min: 0.05, max: 15 },
    dog: { min: 0.5, max: 90 },
  };
  
  const animalLimits = limits[animalType];

  return weightEntryFormSchema.refine((data) => {
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight <= 0) return false;

    // Convert to kg for validation (use data.weightUnit)
    const weightInKg = data.weightUnit === 'kg' ? weight : weight / 2.20462;
    
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
    // generate the error message dynamically
    const weight = parseFloat(data.weight);
    const weightInKg = data.weightUnit === 'kg' ? weight : weight / 2.20462;
    
    // Determine which limit was violated
    if (weightInKg > 200) {
      return {
        message: 'Weight exceeds absolute maximum (200kg / 440lbs)',
        path: ['weight']
      };
    }
    
    // Animal limit violated - show range in user's selected unit
    const displayLimits = data.weightUnit === 'kg'
      ? `${animalLimits.min}-${animalLimits.max}kg`
      : `${(animalLimits.min * 2.20462).toFixed(1)}-${(animalLimits.max * 2.20462).toFixed(1)}lbs`;
    
    return {
      message: `Weight must be between ${displayLimits} for ${animalType}s`,
      path: ['weight']
    };
  });
};

// Export types
export type WeightFormData = z.infer<typeof weightEntryFormSchema>;
export type WeightTargetFormData = z.infer<typeof weightTargetSchema>;

// Validate functions
export const validateWeightEntry = (
  data: unknown, 
  _weightUnit: WeightUnit, 
  animalType: 'cat' | 'dog'
) => {
  const schema = createWeightEntrySchema(_weightUnit, animalType);
  return schema.safeParse(data);
};

