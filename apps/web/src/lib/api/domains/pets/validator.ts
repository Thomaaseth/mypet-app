import type { PetFormData } from '@/lib/validations/pet';
/**
 * Pet data normalization. NOT validation — validation is enforced in exactly
 * two places: the form (zodResolver + shared schema) and the server (strict
 * schema). This only reshapes valid input.
 */
export class PetNormalizer {
  transformPetData(data: Partial<PetFormData>): Partial<PetFormData> {
    const transformed = { ...data };

    // Normalize weight format
    if (transformed.weight) {
      transformed.weight = transformed.weight.replace(',', '.');
    }

    // Trim string fields
    if (transformed.name) {
      transformed.name = transformed.name.trim();
    }
    if (transformed.notes) {
      transformed.notes = transformed.notes.trim();
    }
    if (transformed.microchipNumber) {
      transformed.microchipNumber = transformed.microchipNumber.replace(/[\s-]/g, '');
    }

    return transformed;
  }
}

// Default instance
export const petNormalizer = new PetNormalizer();