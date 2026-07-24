import { z } from 'zod';
import { key } from './i18n-keys';

export type WeightUnit = 'kg' | 'lbs';

// Pet gender and weight unit enums for validation
export const petGenderSchema = z.enum(['male', 'female', 'unknown'], {
  errorMap: () => ({ message: key('pets.validation.invalidGender') })
});

export const weightUnitSchema = z.enum(['kg', 'lbs'], {
  errorMap: () => ({ message: key('weights.validation.invalidWeightUnit') })
});

// Base pet validation schema (no refine so we can use .extend, .shape, .partial)
export const basePetFormSchema = z.object({
  name: z
    .string()
    .min(1, key('pets.validation.nameRequired'))
    .max(50, key('pets.validation.nameTooLong'))
    .regex(/^[\p{L}\s\-'\.]+$/u, key('pets.validation.nameInvalidChars')),
  
  animalType: z.enum(['cat', 'dog'], {
  errorMap: () => ({ message: key('pets.validation.animalTypeRequired') })
  }),

  species: z
    .string()
    .max(50, key('pets.validation.speciesTooLong'))
    .regex(/^[\p{L}\s\-'\.]*$/u, key('pets.validation.speciesInvalidChars'))
    .optional()
    .or(z.literal('')),
  
  gender: petGenderSchema,
  
  birthDate: z
    .string()
    .refine((date) => !date || !isNaN(new Date(date).getTime()), key('pets.validation.invalidBirthDate'))
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
    .regex(/^[A-Za-z0-9\s-]*$/, key('pets.validation.microchipInvalidChars'))
    .max(20, key('pets.validation.microchipTooLong'))
    .optional()
    .or(z.literal('')),
  
  notes: z
    .string()
    .max(200, key('pets.validation.notesTooLong'))
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
  message: key('pets.validation.weightExceedsMax'),
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
  message: key('pets.validation.weightExceedsMax'),
  path: ['weight']
});

export const updatePetSchema = basePetFormSchema
  .omit({ weight: true, weightUnit: true })
  .partial()
  .extend({
    id: z.string().uuid(key('vets.validation.invalidPetId')),
  });

// Export types
export type PetFormData = z.infer<typeof petFormSchema>;
export type CreatePetData = z.infer<typeof createPetSchema>;
export type UpdatePetData = z.infer<typeof updatePetSchema>;

// Validate functions
export const validatePetForm = (data: unknown) => {
  return petFormSchema.safeParse(data);
};

export const validateCreatePet = (data: unknown) => {
  return createPetSchema.safeParse(data);
};

export const validateUpdatePet = (data: unknown) => {
  return updatePetSchema.safeParse(data);
};