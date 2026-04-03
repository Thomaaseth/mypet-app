import { PetNoteService } from './service';
import { petNoteRepository } from './repository';
import { petNoteValidator } from './validator';
import type { PetNoteFormData } from '@/types/pet-notes';

const petNoteService = new PetNoteService(petNoteRepository, petNoteValidator);

export const petNoteApi = {
    getNotes: (petId: string) => petNoteService.getNotes(petId),
    createNote: (petId: string, data: PetNoteFormData) => petNoteService.createNote(petId, data),
    updateNote: (petId: string, noteId: string, data: PetNoteFormData) => petNoteService.updateNote(petId, noteId, data),
    deleteNote: (petId: string, noteId: string) => petNoteService.deleteNote(petId, noteId),
};


export const petNoteErrorHandler = (error: unknown) => petNoteService.mapError(error);

export { PetNoteRepository } from './repository';
export { PetNoteValidator } from './validator';
export { PetNoteService } from './service';