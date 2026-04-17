import { z } from 'zod';

export const petNoteFormSchema = z.object({
    content: z
        .string()
        .min(1, 'Note cannot be empty')
        .max(200, 'Note must be less than 200 characters')
})

export type PetNoteFormData = z.infer<typeof petNoteFormSchema>;

// validation functions for backend 
export const validateCreateNote = (data: unknown) => {
    return petNoteFormSchema.safeParse(data);
};

export const validateUpdateNote = (data: unknown) => {
    return petNoteFormSchema.safeParse(data);
}