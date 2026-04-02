import { db } from '../db';
import { petNotes } from '../db/schema/pet-notes';
import { pets } from '../db/schema/pets';
import { eq, and, desc, count } from 'drizzle-orm';
import type { PetNote, NewPetNote } from '../db/schema/pet-notes';
import { BadRequestError, NotFoundError } from '@/middleware/errors';
import { dbLogger } from '@/lib/logger';
import { copyFile, cp } from 'fs';
import { StringOrBuffer } from 'bun';

const MAX_NOTES_PER_PET = 20;
const MAX_CONTENT_LENGTH = 200;

export interface PetNoteFormData {
    content: string;
}

export class PetNotesService {
    private static async verifyPetOwnership(petId: string, userId: string): Promise<void> {
        const [pet] = await db
            .select()
            .from(pets)
            .where(and(
                eq(pets.id, petId),
                eq(pets.userId, userId),
                eq(pets.isActive, true)
            ));
        
        if (!pet) {
            throw new NotFoundError('Pet not found')
        }
    }

    private static async validateUUID(id: string, fieldName: string): Promise<void> {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!id || !uuidRegex.test(id)) {
            throw new BadRequestError(`Invalid ${fieldName} format`)
        }
    }

    private static validateContent(content: string): void {
        if (!content || content.trim().length === 0) {
            throw new BadRequestError('Notes cannot be empty')
        }
        if (content.length > MAX_CONTENT_LENGTH) {
            throw new BadRequestError(`Notes must be less than ${MAX_CONTENT_LENGTH} characters`)
        }
    }

    // GET all notes
    static async getNotes(petId: string, userId: string): Promise<PetNote[]> {
        try {
            this.validateUUID(petId, 'pet ID');
            await this.verifyPetOwnership(petId, userId)
        
            return await db
                .select()
                .from(petNotes)
                .where(and(
                    eq(petNotes.petId, petId),
                    eq(petNotes.userId, userId)
                ))
                .orderBy(desc(petNotes.createdAt))
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof BadRequestError) {
                throw error
            }
            dbLogger.error({ err: error, petId }, 'Error fetching pet notes')
            throw new BadRequestError('Failed to fetch notes')
        }       
    }

    static async createNote(petId: string, userId: string, data: PetNoteFormData): Promise<PetNote> {
        try {
            this.validateUUID(petId, 'pet ID');
            this.validateContent(data.content);
            await this.verifyPetOwnership(petId, userId);

            // enforce cap
            const [{ value: noteCount }] = await db
                .select({ value: count() })
                .from(petNotes)
                .where(and(
                    eq(petNotes.petId, petId),
                    eq(petNotes.userId, userId)
                ));
            if (noteCount >= MAX_NOTES_PER_PET) {
                throw new BadRequestError(`You can have a maximum of ${MAX_NOTES_PER_PET} notes`)
            }

            const newNote: NewPetNote = {
                userId,
                petId,
                content: data.content.trim(),
            };
            const [created] = await db
                .insert(petNotes)
                .values(newNote)
                .returning();

            return created;
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof BadRequestError) {
                throw error
            }
            dbLogger.error({ err: error, petId }, 'Error creating pet note');
            throw new BadRequestError('Failed to create note')
        }
    }

    static async updateNote(
        petId: string,
        noteId: string, 
        userId: string,
        data: PetNoteFormData
    ): Promise<PetNote> {
        try {
            this.validateUUID(petId, 'Pet ID');
            this.validateUUID(noteId, 'note ID');
            this.validateContent(data.content);
            await this.verifyPetOwnership(petId, userId);

            // verify note exists and belong to user and pet
            const [existing] = await db 
                .select()
                .from(petNotes)
                .where(and(
                    eq(petNotes.id, noteId),
                    eq(petNotes.petId, petId),
                    eq(petNotes.userId, userId)
                ));
                if (!existing) {
                    throw new NotFoundError('Note not found');
                }

                const [updated] = await db
                    .update(petNotes)
                    .set({
                        content: data.content.trim(),
                        updatedAt: new Date(),
                    })
                    .where(eq(petNotes.id, noteId))
                    .returning()

                return updated;

        } catch (error) {
            if (error instanceof NotFoundError || error instanceof BadRequestError) {
                throw error;
            }
            dbLogger.error({ err: error, noteId }, 'Error updating pet note');
            throw new BadRequestError('Failed to update note');
        }
    }

    static async deleteNote(petId: string, noteId: string, userId: string): Promise<void> {
        try {
            this.validateUUID(petId, 'Pet ID');
            this.validateUUID(noteId, 'note ID');
            await this.verifyPetOwnership(petId, userId);

            const [existing] = await db
                .select()
                .from(petNotes)
                .where(and(
                    eq(petNotes.id, noteId),
                    eq(petNotes.petId, petId),
                    eq(petNotes.userId, userId)
                ));

                if (!existing) {
                    throw new NotFoundError('Cannot find note')
                }
                await db
                    .delete(petNotes)
                    .where(eq(petNotes.id, noteId))
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof BadRequestError) {
                throw error;
            }
            dbLogger.error({ err: error, noteId }, 'Error deleting pet note');
            throw new BadRequestError('Failed to delete note');
            }
        }
}