import { get, post, put, del } from '../../base';
import type { PetNoteApiResponse, PetNotesApiResponse, PetNoteFormData } from '@/types/pet-notes';

export class PetNoteRepository {
    async getNotes(petId: string): Promise<PetNotesApiResponse> {
        return await get<PetNotesApiResponse>(`/api/pets/${petId}/notes`)
    };

    async createNote(petId: string, data: PetNoteFormData): Promise<PetNoteApiResponse> {
        return await post<PetNoteApiResponse, PetNoteFormData>(`/api/pets/${petId}/notes`, data)
    };

    async updateNote(petId: string, noteId: string, data: PetNoteFormData): Promise<PetNoteApiResponse> {
        return await put<PetNoteApiResponse, PetNoteFormData>(`/api/pets/${petId}/notes/${noteId}`, data)
    };

    async deleteNote(petId: string, noteId: string): Promise<void> {
        await del<{ message: string }>(`/api/pets/${petId}/notes/${noteId}`);
    };
}

export const petNoteRepository = new PetNoteRepository();