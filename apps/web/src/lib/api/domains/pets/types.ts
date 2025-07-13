import type { Pet, PetFormData } from '@/types/pet'

export interface PetsApiResponse {
    pets: Pet[];
    total: number;
}

export interface PetApiResponse {
    pet: Pet;
}

export interface PetError {
    message: string;
    field?: keyof PetFormData;
    code: string;
}