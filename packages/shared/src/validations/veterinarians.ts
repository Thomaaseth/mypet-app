import { z } from 'zod';
import { key } from './i18n-keys';

// Phone validation - international format support
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

// Base veterinarian validation schema
export const baseVeterinarianFormSchema = z.object({
  vetName: z
    .string()
    .min(1, key('vets.validation.vetNameRequired'))
    .max(100, key('vets.validation.vetNameTooLong'))
    .regex(/^[\p{L}\s\-'\.]+$/u, key('vets.validation.vetNameInvalidChars')),
  
  clinicName: z
    .string()
    .max(100, key('vets.validation.clinicNameTooLong'))
    .regex(/^[\p{L}\p{N}\s\-'\.&]*$/u, key('vets.validation.clinicNameInvalidChars'))
    .optional()
    .or(z.literal('')),
  
  phone: z
    .string()
    .min(1, key('vets.validation.phoneRequired'))
    .regex(phoneRegex, key('vets.validation.phoneInvalid'))
    .max(20, key('vets.validation.phoneTooLong')),
  
  email: z
    .string()
    .email(key('auth.validation.invalidEmail'))
    .max(100, key('vets.validation.emailTooLong'))
    .optional()
    .or(z.literal('')),
  
    website: z
    .string()
    .min(4, key('vets.validation.websiteTooShort')) // At minimum: "w.co"
    .max(100, key('vets.validation.websiteTooLong')) // More reasonable
    .regex(
      /^(https?:\/\/)?(www\.)?[\w\-]+(\.[\w\-]+)+/,
      key('vets.validation.websiteInvalid')
    )
    .optional()
    .or(z.literal('')),
  
  addressLine1: z
    .string()
    .min(1, key('vets.validation.addressRequired'))
    .max(255, key('vets.validation.addressTooLong')),
  
  addressLine2: z
    .string()
    .max(255, key('vets.validation.addressLine2TooLong'))
    .optional()
    .or(z.literal('')),
  
  city: z
    .string()
    .min(1, key('vets.validation.cityRequired'))
    .max(100, key('vets.validation.cityTooLong'))
    .regex(/^[\p{L}\s\-'\.]+$/u, key('vets.validation.cityInvalidChars')),
  
  zipCode: z
    .string()
    .min(1, key('vets.validation.zipCodeRequired'))
    .max(20, key('vets.validation.zipCodeTooLong'))
    .regex(/^[A-Za-z0-9\s\-]+$/, key('vets.validation.zipCodeInvalidChars')),
  
  notes: z
    .string()
    .max(100, key('vets.validation.notesTooLong'))
    .optional()
    .or(z.literal('')),
});

// Schema for creating a new veterinarian
export const createVeterinarianSchema = baseVeterinarianFormSchema;

// Schema for updating a veterinarian
export const updateVeterinarianSchema = baseVeterinarianFormSchema.extend({
  id: z.string().uuid(key('vets.validation.invalidVetId')),
});

// Types inferred from schemas
export type VeterinarianFormData = z.infer<typeof baseVeterinarianFormSchema>;
export type CreateVeterinarianData = z.infer<typeof createVeterinarianSchema>;
export type UpdateVeterinarianData = z.infer<typeof updateVeterinarianSchema>;

// Validation functions for backend
export const validateCreateVeterinarian = (data: unknown) => {
  return createVeterinarianSchema.safeParse(data);
};

export const validateUpdateVeterinarian = (data: unknown) => {
  return updateVeterinarianSchema.safeParse(data);
};

export const validatePetAssignment = (data: unknown) => {
  return petAssignmentSchema.safeParse(data);
}

// Pet assignment schema for "Apply to other pets" feature
// Not currently used anywhere TODO check 
export const petAssignmentSchema = z.object({
  petIds: z.array(z.string().uuid(key('vets.validation.invalidPetId'))).min(1, key('vets.validation.selectAtLeastOnePet')),
});

export type PetAssignmentData = z.infer<typeof petAssignmentSchema>;