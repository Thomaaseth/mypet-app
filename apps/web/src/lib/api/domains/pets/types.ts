import type { Pet } from '@/types/pet'
import type { PetFormData } from '@/lib/validations/pet';

export interface PetSignedUrlResponse {
    signedUrl: string | null;
}

// returned by POST /api/pets/:id/image
// signedUrl is short lived (1h) used for display
export interface PetImageUploadResponse {
    pet: Pet;
    signedUrl: string;
}

export interface PetError {
    message: string;
    field?: keyof PetFormData;
    code: string;
}