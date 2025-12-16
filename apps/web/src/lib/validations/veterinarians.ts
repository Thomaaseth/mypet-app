import { z } from 'zod';

// Phone validation - international format support
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

// Base veterinarian validation schema
export const baseVeterinarianFormSchema = z.object({
  vetName: z
    .string()
    .min(1, 'Veterinarian name is required')
    .max(100, 'Veterinarian name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Veterinarian name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  clinicName: z
    .string()
    .max(150, 'Clinic name must be less than 150 characters')
    .regex(/^[a-zA-Z0-9\s\-'\.&]*$/, 'Clinic name can only contain letters, numbers, spaces, hyphens, apostrophes, periods, and ampersands')
    .optional()
    .or(z.literal('')),
  
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid phone number')
    .max(20, 'Phone number must be less than 20 characters'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  website: z
    .string()
    .url('Please enter a valid URL (must start with http:// or https://)')
    .max(255, 'Website URL must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .max(255, 'Address must be less than 255 characters'),
  
  addressLine2: z
    .string()
    .max(255, 'Address line 2 must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'City can only contain letters, spaces, hyphens, apostrophes, and periods'),
  
  zipCode: z
    .string()
    .min(1, 'ZIP/Postal code is required')
    .max(20, 'ZIP/Postal code must be less than 20 characters')
    .regex(/^[A-Za-z0-9\s\-]+$/, 'ZIP/Postal code can only contain letters, numbers, spaces, and hyphens'),
  
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

// Schema for creating a new veterinarian
export const createVeterinarianSchema = baseVeterinarianFormSchema;

// Schema for updating a veterinarian
export const updateVeterinarianSchema = baseVeterinarianFormSchema.extend({
  id: z.string().uuid('Invalid veterinarian ID'),
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

// Pet assignment schema for "Apply to other pets" feature
export const petAssignmentSchema = z.object({
  petIds: z.array(z.string().uuid('Invalid pet ID')).min(1, 'Select at least one pet'),
});

export type PetAssignmentData = z.infer<typeof petAssignmentSchema>;


