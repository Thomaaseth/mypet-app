import { get, post, put, del } from '../../base';
import type { PetNote, PetNoteFormData } from '@/types/pet-notes';

export class PetNoteRepository {
    async getNotes(petId: string): Promise<PetNote[]> {
        const result = await get<{ notes: PetNote[]; total: number }>(`/api/pets/${petId}/notes`);
        return result.notes;
    }

    async createNote(petId: string, data: PetNoteFormData): Promise<PetNote> {
        const result = await post<{ note: PetNote }, PetNoteFormData>(`/api/pets/${petId}/notes`, data);
        return result.note;
    }

    async updateNote(petId: string, noteId: string, data: PetNoteFormData): Promise<PetNote> {
        const result = await put<{ note: PetNote }, PetNoteFormData>(`/api/pets/${petId}/notes/${noteId}`, data);
        return result.note;
    }

    async deleteNote(petId: string, noteId: string): Promise<void> {
        await del<{ message: string }>(`/api/pets/${petId}/notes/${noteId}`);
    }
}

export const petNoteRepository = new PetNoteRepository();