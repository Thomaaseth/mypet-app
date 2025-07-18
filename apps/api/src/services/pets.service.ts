// apps/api/src/services/pets.service.ts
import { db } from '../db';
import { pets } from '../db/schema/pets';
import { eq, and, desc } from 'drizzle-orm';
import type { Pet, NewPet } from '../db/schema/pets';
import { 
  BadRequestError, 
  NotFoundError, 
  UserForbiddenError 
} from '../middleware/errors';

export class PetsService {
  // Get all pets for a user
  static async getUserPets(userId: string): Promise<Pet[]> {
    try {
      const result = await db
        .select()
        .from(pets)
        .where(and(
          eq(pets.userId, userId),
          eq(pets.isActive, true)
        ))
        .orderBy(desc(pets.createdAt));

      return result;
    } catch (error) {
      console.error('Error fetching user pets:', error);
      throw new BadRequestError('Failed to fetch pets');
    }
  }

  // Get a single pet by ID (with ownership check)
  static async getPetById(petId: string, userId: string): Promise<Pet> {
    try {
      const [pet] = await db
        .select()
        .from(pets)
        .where(and(
          eq(pets.id, petId),
          eq(pets.userId, userId),
          eq(pets.isActive, true)
        ));

      if (!pet) {
        throw new NotFoundError('Pet not found');
      }

      return pet;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching pet by ID:', error);
      throw new BadRequestError('Failed to fetch pet');
    }
  }

  // Create a new pet
  static async createPet(petData: NewPet): Promise<Pet> {
    try {
      // Validate required fields
      if (!petData.name || !petData.userId) {
        throw new BadRequestError('Pet name and user ID are required');
      }

      // Convert empty strings to null for optional fields
      const cleanedData: NewPet = {
        ...petData,
        species: petData.species || null,
        birthDate: petData.birthDate || null,
        weight: petData.weight || null,
        microchipNumber: petData.microchipNumber || null,
        notes: petData.notes || null,
      };

      const [newPet] = await db
        .insert(pets)
        .values(cleanedData)
        .returning();

      return newPet;
    } catch (error) {
      console.error('Error creating pet:', error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError('Failed to create pet');
    }
  }

  // Update a pet (with ownership check)
  static async updatePet(
    petId: string, 
    userId: string, 
    updateData: Partial<NewPet>
  ): Promise<Pet> {
    try {
      // First verify the pet exists and belongs to the user
      await this.getPetById(petId, userId);

      // Clean the update data (convert empty strings to null)
      const cleanedData: Partial<NewPet> = {
        ...updateData,
        species: updateData.species === '' ? null : updateData.species,
        birthDate: updateData.birthDate === '' ? null : updateData.birthDate,
        weight: updateData.weight === '' ? null : updateData.weight,
        microchipNumber: updateData.microchipNumber === '' ? null : updateData.microchipNumber,
        notes: updateData.notes === '' ? null : updateData.notes,
      };

      const [updatedPet] = await db
        .update(pets)
        .set({
          ...cleanedData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(pets.id, petId),
          eq(pets.userId, userId)
        ))
        .returning();

      if (!updatedPet) {
        throw new NotFoundError('Pet not found');
      }

      return updatedPet;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error updating pet:', error);
      throw new BadRequestError('Failed to update pet');
    }
  }

  // Soft delete a pet (with ownership check)
  static async deletePet(petId: string, userId: string): Promise<void> {
    try {
      // First verify the pet exists and belongs to the user
      await this.getPetById(petId, userId);

      const [updatedPet] = await db
        .update(pets)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(
          eq(pets.id, petId),
          eq(pets.userId, userId)
        ))
        .returning();

      if (!updatedPet) {
        throw new NotFoundError('Pet not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error deleting pet:', error);
      throw new BadRequestError('Failed to delete pet');
    }
  }

  // Hard delete a pet (for admin use or permanent deletion)
  static async hardDeletePet(petId: string, userId: string): Promise<void> {
    try {
      // First verify the pet exists and belongs to the user
      await this.getPetById(petId, userId);

      await db
        .delete(pets)
        .where(and(
          eq(pets.id, petId),
          eq(pets.userId, userId)
        ));
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error hard deleting pet:', error);
      throw new BadRequestError('Failed to permanently delete pet');
    }
  }

  // Get pet count for a user
  static async getUserPetCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select()
        .from(pets)
        .where(and(
          eq(pets.userId, userId),
          eq(pets.isActive, true)
        ));

      return result.length;
    } catch (error) {
      console.error('Error getting pet count:', error);
      return 0;
    }
  }
}