import { z } from 'zod';
import { key } from './i18n-keys';

export const petNoteFormSchema = z.object({
    content: z
        .string()
        .min(1, key('notes.validation.contentRequired'))
        .max(200, key('notes.validation.contentTooLong'))
})

export type PetNoteFormData = z.infer<typeof petNoteFormSchema>;

// validation functions for backend 
export const validateCreateNote = (data: unknown) => {
    return petNoteFormSchema.safeParse(data);
};

export const validateUpdateNote = (data: unknown) => {
    return petNoteFormSchema.safeParse(data);
};