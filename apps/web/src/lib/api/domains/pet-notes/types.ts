import type { PetNoteFormData } from '@/types/pet-notes';

export interface PetNoteError {
    message: string;
    field?: keyof PetNoteFormData;
    code: string;
}