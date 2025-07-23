import { db } from '../db';
import { weightEntries } from '../db/schema/weight-entries';
import { pets } from '../db/schema/pets';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { WeightEntry, NewWeightEntry, WeightEntryFormData } from '../db/schema/weight-entries';
import type { WeightUnit } from '../db/schema/pets';
import { 
  BadRequestError, 
  NotFoundError, 
  UserForbiddenError 
} from '../middleware/errors';
import { PetsService } from './pets.service';

export class WeightEntriesService {
  // Verify pet ownership (helper method)
  private static async verifyPetOwnership(petId: string, userId: string): Promise<void> {
    try {
      await PetsService.getPetById(petId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Pet not found or access denied');
      }
      throw error;
    }
  }

  // Get all weight entries for a pet (with ownership check)
  static async getWeightEntries(petId: string, userId: string): Promise<{ weightEntries: WeightEntry[], weightUnit: WeightUnit }> {
    try {
      // Verify pet ownership first
      const pet = await PetsService.getPetById(petId, userId);

      const entries = await db
        .select()
        .from(weightEntries)
        .where(eq(weightEntries.petId, petId))
        .orderBy(asc(weightEntries.date)); // Order by date for chart display

      return {
        weightEntries: entries,
        weightUnit: pet.weightUnit || 'kg' // Fallback to kg if somehow null
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching weight entries:', error);
      throw new BadRequestError('Failed to fetch weight entries');
    }
  }

  // Get a single weight entry by ID (with ownership check)
  static async getWeightEntryById(petId: string, weightId: string, userId: string): Promise<WeightEntry> {
    try {
      // Verify pet ownership first
      await this.verifyPetOwnership(petId, userId);

      const [entry] = await db
        .select()
        .from(weightEntries)
        .where(and(
          eq(weightEntries.id, weightId),
          eq(weightEntries.petId, petId)
        ));

      if (!entry) {
        throw new NotFoundError('Weight entry not found');
      }

      return entry;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching weight entry by ID:', error);
      throw new BadRequestError('Failed to fetch weight entry');
    }
  }

  // Create a new weight entry
  static async createWeightEntry(petId: string, userId: string, entryData: WeightEntryFormData): Promise<WeightEntry> {
    try {
      // Verify pet ownership first
      await this.verifyPetOwnership(petId, userId);

      // Validate required fields
      if (!entryData.weight || !entryData.date) {
        throw new BadRequestError('Weight and date are required');
      }

      // Validate weight is a positive number
      const weightValue = parseFloat(entryData.weight.toString());
      if (isNaN(weightValue) || weightValue <= 0) {
        throw new BadRequestError('Weight must be a positive number');
      }

      // Validate date is not in the future
      const entryDate = new Date(entryData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (entryDate > today) {
        throw new BadRequestError('Date cannot be in the future');
      }

      const newEntryData: NewWeightEntry = {
        petId,
        weight: entryData.weight,
        date: entryData.date,
      };

      const [newEntry] = await db
        .insert(weightEntries)
        .values(newEntryData)
        .returning();

      return newEntry;
    } catch (error) {
      console.error('Error creating weight entry:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to create weight entry');
    }
  }

  // Update a weight entry (with ownership check)
  static async updateWeightEntry(
    petId: string, 
    weightId: string, 
    userId: string, 
    updateData: Partial<WeightEntryFormData>
  ): Promise<WeightEntry> {
    try {
      // First verify the entry exists and user owns the pet
      await this.getWeightEntryById(petId, weightId, userId);

      // Validate weight if provided
      if (updateData.weight !== undefined) {
        const weightValue = parseFloat(updateData.weight.toString());
        if (isNaN(weightValue) || weightValue <= 0) {
          throw new BadRequestError('Weight must be a positive number');
        }
      }

      // Validate date if provided
      if (updateData.date !== undefined) {
        const entryDate = new Date(updateData.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (entryDate > today) {
          throw new BadRequestError('Date cannot be in the future');
        }
      }

      const [updatedEntry] = await db
        .update(weightEntries)
        .set({
          ...updateData,
          updatedAt: new Date(), // Always update the timestamp
        })
        .where(and(
          eq(weightEntries.id, weightId),
          eq(weightEntries.petId, petId)
        ))
        .returning();

      if (!updatedEntry) {
        throw new NotFoundError('Weight entry not found');
      }

      return updatedEntry;
    } catch (error) {
      console.error('Error updating weight entry:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to update weight entry');
    }
  }

  // Delete a weight entry (with ownership check)
  static async deleteWeightEntry(petId: string, weightId: string, userId: string): Promise<void> {
    try {
      // First verify the entry exists and user owns the pet
      await this.getWeightEntryById(petId, weightId, userId);

      const result = await db
        .delete(weightEntries)
        .where(and(
          eq(weightEntries.id, weightId),
          eq(weightEntries.petId, petId)
        ));

      // Note: Drizzle doesn't return affected rows count like some ORMs
      // The getWeightEntryById call above ensures the entry exists
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to delete weight entry');
    }
  }
}