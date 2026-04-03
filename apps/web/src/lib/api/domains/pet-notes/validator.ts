import { petNoteFormSchema } from "@/lib/validations/pet-notes";
import type { PetNoteFormData } from "@/types/pet-notes";
import { ValidationError } from '../../errors';

export class PetNoteValidator {
    validateNoteData(data: PetNoteFormData): void {
        const result = petNoteFormSchema.safeParse(data);
        if (!result.success) {
            const firstError = result.error.errors[0];
            throw new ValidationError(firstError.message, 'content');
        }
    }
}

export const petNoteValidator = new PetNoteValidator();
