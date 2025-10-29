import { z } from 'zod';
import type { WeightUnit } from '@/types/pet';

// Pet gender and weight unit enums for validation
export const petGenderSchema = z.enum(['male', 'female', 'unknown'], {
  errorMap: () => ({ message: 'Please select a valid gender' })
});

export const weightUnitSchema = z.enum(['kg', 'lbs'], {
  errorMap: () => ({ message: 'Please select a valid weight unit' })
});

// Base pet validation schema (no refine so we can use .extend, .shape, .partial)
export const basePetFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Pet name is required')
    .max(50, 'Pet name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Pet name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  animalType: z.enum(['cat', 'dog'], {
  errorMap: () => ({ message: 'Please select if this is a cat or dog' })
  }),

  species: z
    .string()
    .max(50, 'Species/breed must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-'\.]*$/, 'Species/breed can only contain letters, spaces, hyphens, apostrophes, and periods')
    .optional()
    .or(z.literal('')),
  
  gender: petGenderSchema,
  
  birthDate: z
    .string()
    .refine((date) => {
      if (!date) return true; // Optional field
      const parsedDate = new Date(date);
      const today = new Date();
      const maxAge = new Date();
      maxAge.setFullYear(today.getFullYear() - 30); // 30 years max age
      
      return parsedDate <= today && parsedDate >= maxAge;
    }, 'Please enter a valid birth date (not in the future, not older than 30 years)')
    .optional()
    .or(z.literal('')),
  
  weight: z
    .string()
    .optional()
    .or(z.literal('')),
    
  weightUnit: weightUnitSchema,
  
  isNeutered: z.boolean(),
  
  microchipNumber: z
    .string()
    .regex(/^[A-Za-z0-9]*$/, 'Microchip number can only contain letters and numbers')
    .max(50, 'Microchip number must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

// Enhanced validation with unit-specific weight limits (this will be a ZodEffects)
export const petFormSchema = basePetFormSchema.refine((data) => {
  if (!data.weight) return true; // Optional field
  
  const weight = parseFloat(data.weight);
  if (isNaN(weight) || weight <= 0) return false;
  
  // Unit-specific validation
  if (data.weightUnit === 'kg') {
    return weight <= 200; // Max 200kg (440 lbs)
  } else if (data.weightUnit === 'lbs') {
    return weight <= 440; // Max 440 lbs (200kg)
  }
  
  return true;
}, {
  message: 'Weight exceeds maximum allowed (200kg / 440lbs)',
  path: ['weight']
});

// Schema for creating a new pet (all required fields must be provided)
export const createPetSchema = basePetFormSchema.extend({
  name: basePetFormSchema.shape.name, // name is already required
}).refine((data) => {
  if (!data.weight) return true; // Optional field
  
  const weight = parseFloat(data.weight);
  if (isNaN(weight) || weight <= 0) return false;
  
  // Unit-specific validation
  if (data.weightUnit === 'kg') {
    return weight <= 200; // Max 200kg (440 lbs)
  } else if (data.weightUnit === 'lbs') {
    return weight <= 440; // Max 440 lbs (200kg)
  }
  
  return true;
}, {
  message: 'Weight exceeds maximum allowed (200kg / 440lbs)',
  path: ['weight']
});

// Schema for updating a pet (more flexible)
// export const updatePetSchema = basePetFormSchema.partial().extend({
//   id: z.string().uuid('Invalid pet ID'),
// }).refine((data) => {
//   if (!data.weight) return true; // Optional field
  
//   const weight = parseFloat(data.weight);
//   if (isNaN(weight) || weight <= 0) return false;
  
//   // Unit-specific validation
//   if (data.weightUnit === 'kg') {
//     return weight <= 200; // Max 200kg (440 lbs)
//   } else if (data.weightUnit === 'lbs') {
//     return weight <= 440; // Max 440 lbs (200kg)
//   }
  
//   return true;
// }, {
//   message: 'Weight exceeds maximum allowed (200kg / 440lbs)',
//   path: ['weight']
// });

export const updatePetSchema = basePetFormSchema
  .omit({ weight: true, weightUnit: true })
  .partial()
  .extend({
    id: z.string().uuid('Invalid pet ID'),
  });

// Export types
export type PetFormData = z.infer<typeof petFormSchema>;
export type CreatePetData = z.infer<typeof createPetSchema>;
export type UpdatePetData = z.infer<typeof updatePetSchema>;

// Utility functions for validation
export const validatePetForm = (data: unknown) => {
  return petFormSchema.safeParse(data);
};

export const validateCreatePet = (data: unknown) => {
  return createPetSchema.safeParse(data);
};

export const validateUpdatePet = (data: unknown) => {
  return updatePetSchema.safeParse(data);
};

// Weight conversion utilities
export const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return weight * 2.20462;
  } else if (fromUnit === 'lbs' && toUnit === 'kg') {
    return weight / 2.20462;
  }
  
  return weight;
};

export const formatWeight = (weight: string | null, unit: WeightUnit): string => {
  if (!weight) return 'Unknown';
  return `${weight} ${unit}`;
};

export const getWeightInKg = (weight: string | null, unit: WeightUnit): number | null => {
  if (!weight) return null;
  const weightNum = parseFloat(weight);
  if (isNaN(weightNum)) return null;
  
  return unit === 'kg' ? weightNum : convertWeight(weightNum, 'lbs', 'kg');
};

export const getWeightInLbs = (weight: string | null, unit: WeightUnit): number | null => {
  if (!weight) return null;
  const weightNum = parseFloat(weight);
  if (isNaN(weightNum)) return null;
  
  return unit === 'lbs' ? weightNum : convertWeight(weightNum, 'kg', 'lbs');
};

// Age calculation utility
export const calculatePetAge = (birthDate: string | null): string => {
  if (!birthDate) return 'Unknown';
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    const adjustedYears = years - 1;
    const adjustedMonths = months < 0 ? 12 + months : months;
    
    if (adjustedYears === 0) {
      return `${adjustedMonths} month${adjustedMonths !== 1 ? 's' : ''}`;
    }
    return `${adjustedYears} year${adjustedYears !== 1 ? 's' : ''}, ${adjustedMonths} month${adjustedMonths !== 1 ? 's' : ''}`;
  }
  
  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  return years === 1 ? '1 year' : `${years} years`;
};

// Common species suggestions for autocomplete (optional helper)
export const commonSpeciesSuggestions = {
  cat: [
    'Mixed Breed',
    'Persian Cat',
    'Maine Coon',
    'British Shorthair',
    'Ragdoll',
    'Bengal Cat',
    'Siamese Cat',
    'Russian Blue',
    'Scottish Fold',
  ],
  dog: [
    'Mixed Breed',
    'Labrador Retriever',
    'Golden Retriever',
    'German Shepherd',
    'French Bulldog',
    'Bulldog',
    'Poodle',
    'Beagle',
    'Rottweiler',
    'Yorkshire Terrier',
  ]
} as const;