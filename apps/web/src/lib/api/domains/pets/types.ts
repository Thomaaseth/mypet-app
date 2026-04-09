import type { Pet, PetFormData } from '@/types/pet'

export interface PetWithSignedUrl {
    pet: Pet;
    signedUrl: string | null;
}

export interface PetsApiResponse {
    pets: PetWithSignedUrl[];
    total: number;
}

export interface PetApiResponse {
    pet: Pet;
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