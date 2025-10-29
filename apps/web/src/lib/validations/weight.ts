import { z } from 'zod';
import type { WeightUnit } from '@/types/pet';

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

// Enhanced validation with unit-specific weight limits
export const createWeightEntrySchema = (weightUnit: WeightUnit) => {
  return weightEntryFormSchema.refine((data) => {
    const weight = parseFloat(data.weight);
    if (isNaN(weight) || weight <= 0) return false;
    
    // Unit-specific validation (same limits as pet validation)
    if (weightUnit === 'kg') {
      return weight <= 200; // Max 200kg (440 lbs)
    } else if (weightUnit === 'lbs') {
      return weight <= 440; // Max 440 lbs (200kg)
    }
    
    return true;
  }, {
    message: `Weight exceeds maximum allowed (200kg / 440lbs)`,
    path: ['weight']
  });
};

// Export types
export type WeightFormData = z.infer<typeof weightEntryFormSchema>;

// Utility functions for validation
export const validateWeightEntry = (data: unknown, weightUnit: WeightUnit) => {
  const schema = createWeightEntrySchema(weightUnit);
  return schema.safeParse(data);
};

// Date formatting utilities for weight tracking
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};