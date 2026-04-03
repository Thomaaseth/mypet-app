import type { PetNoteRepository } from "./repository";
import type { PetNoteValidator } from "./validator";
import {
    ApiError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
} from '../../errors';
import type {
    PetNote,
    PetNotesApiResponse,
    PetNoteFormData,
    PetNoteError,
} from '@/types/pet-notes';

export class PetNoteService {
    constructor(
        private repository: PetNoteRepository,
        private validator: PetNoteValidator
    ) {}

    async getNotes(petId: string): Promise<PetNotesApiResponse> {
        try {
            return await this.repository.getNotes(petId);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createNote(petId: string, data: PetNoteFormData): Promise<PetNote> {
        try {
            this.validator.validateNoteData(data);
            const result = await this.repository.createNote(petId, data);
            return result.note;
        } catch (error) {
            throw this.handleError(error);
        }
    }
    
    async updateNote(petId: string, noteId: string, data: PetNoteFormData): Promise<PetNote> {
        try {
            this.validator.validateNoteData(data);
            const result = await this.repository.updateNote(petId, noteId, data);
            return result.note;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async deleteNote(petId: string, noteId: string): Promise<void> {
        try {
            await this.repository.deleteNote(petId, noteId);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    mapError(error: unknown): PetNoteError {
        let message = 'An unexpected error occured';
        let field: keyof PetNoteFormData | undefined;
        let code = 'UNKNOWN_ERROR';

        if (error instanceof ValidationError) {
            message = error.message;
            field = 'content';
            code = 'VALIDATION_ERROR';
        } else if (error instanceof NotFoundError) {
            message = 'Note not found';
            code = 'NOT_FOUND';
        } else if (error instanceof UnauthorizedError) {
            message = 'You must be logged in to perform this action';
            code = 'UNAUTHORIZED';
        } else if (error instanceof ForbiddenError) {
            message = 'You do not have permission to perform this action';
            code = 'FORBIDDEN';
        } else if (error instanceof ApiError) {
            message = error.message;
            code = error.code || 'API_ERROR';
        } else if (error instanceof Error) {
            message = error.message;
        }

        return { message, field, code };
    }

    private handleError(error: unknown): Error {
        if (
            error instanceof ValidationError ||
            error instanceof NotFoundError ||
            error instanceof UnauthorizedError ||
            error instanceof ForbiddenError ||
            error instanceof ApiError
        ) {
            return error;
        }
        return new ApiError('An unexpected error occured');
    }
}