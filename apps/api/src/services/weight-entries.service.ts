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

  // Validate weight based on animal type and unit
  private static validateWeightLimits(weight: number, animalType: string, weightUnit: WeightUnit): void {
    // Convert weight to kg for consistent validation
    let weightInKg = weight;
    if (weightUnit === 'lbs') {
      weightInKg = weight / 2.20462; // Convert lbs to kg
    }

    // Define realistic weight ranges per animal type (in kg)
    const weightLimits = {
      cat: { min: 1, max: 15 }, // 1-15kg (2.2-33lbs)
      dog: { min: 0.5, max: 90 }, // 0.5-90kg (1-200lbs) 
    };

    // Get limits for this animal type, fallback to 'other'
    const limits = weightLimits[animalType as keyof typeof weightLimits];

    if (weightInKg < limits.min || weightInKg > limits.max) {
      const displayWeight = weightUnit === 'kg' ? `${weight}kg` : `${weight}lbs`;
      const displayLimits = weightUnit === 'kg' 
        ? `${limits.min}-${limits.max}kg`
        : `${(limits.min * 2.20462).toFixed(1)}-${(limits.max * 2.20462).toFixed(1)}lbs`;
      
      throw new BadRequestError(
        `Weight ${displayWeight} is outside realistic range for ${animalType} (${displayLimits})`
      );
    }

    // Additional check: enforce absolute maximum of 200kg regardless of animal type
    const absoluteMaxKg = 200;
    const absoluteMaxDisplay = weightUnit === 'kg' ? '200kg' : '440lbs';
    
    if (weightInKg > absoluteMaxKg) {
      throw new BadRequestError(`Weight exceeds maximum allowed (${absoluteMaxDisplay})`);
    }
  }

  // Check for duplicate weight entries on the same date
  private static async checkDuplicateDate(petId: string, date: string): Promise<void> {
    const existingEntry = await db
      .select()
      .from(weightEntries)
      .where(and(
        eq(weightEntries.petId, petId),
        eq(weightEntries.date, date)
      ))
      .limit(1);

    if (existingEntry.length > 0) {
      throw new BadRequestError(
        `Weight entry already exists for ${date}. Please use update instead or choose a different date.`
      );
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

  // Create a new weight entry with proper business logic validation
  static async createWeightEntry(petId: string, userId: string, entryData: WeightEntryFormData): Promise<WeightEntry> {
    try {
      // Verify pet ownership first and get pet data for validation
      const pet = await PetsService.getPetById(petId, userId);

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

      // NEW: Validate weight limits based on animal type and weight unit
      this.validateWeightLimits(weightValue, pet.animalType, pet.weightUnit || 'kg');

      // NEW: Check for existing entry on the same date and update if exists (upsert behavior)
      const existingEntry = await db
        .select()
        .from(weightEntries)
        .where(and(
          eq(weightEntries.petId, petId),
          eq(weightEntries.date, entryData.date)
        ))
        .limit(1);

      if (existingEntry.length > 0) {
        // Update existing entry
        const [updatedEntry] = await db
          .update(weightEntries)
          .set({
            weight: entryData.weight,
            updatedAt: new Date()
          })
          .where(eq(weightEntries.id, existingEntry[0].id))
          .returning();
        
        return updatedEntry;
      }

      // Create new entry if none exists for this date
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

  // Update a weight entry (with ownership check and validation)
  static async updateWeightEntry(
    petId: string, 
    weightId: string, 
    userId: string, 
    updateData: Partial<WeightEntryFormData>
  ): Promise<WeightEntry> {
    try {
      // First verify the entry exists and user owns the pet
      const existingEntry = await this.getWeightEntryById(petId, weightId, userId);
      const pet = await PetsService.getPetById(petId, userId);

      // Validate weight if provided
      if (updateData.weight !== undefined) {
        const weightValue = parseFloat(updateData.weight.toString());
        if (isNaN(weightValue) || weightValue <= 0) {
          throw new BadRequestError('Weight must be a positive number');
        }
        
        // NEW: Validate weight limits for updates too
        this.validateWeightLimits(weightValue, pet.animalType, pet.weightUnit || 'kg');
      }

      // Validate date if provided
      if (updateData.date !== undefined) {
        const entryDate = new Date(updateData.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (entryDate > today) {
          throw new BadRequestError('Date cannot be in the future');
        }

        // NEW: Check for duplicate dates when updating (excluding current entry)
        if (updateData.date !== existingEntry.date) {
          await this.checkDuplicateDate(petId, updateData.date);
        }
      }

      // Update the entry
      const [updatedEntry] = await db
        .update(weightEntries)
        .set({
          ...updateData,
          updatedAt: new Date()
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

      // Delete the entry
      const deletedRows = await db
        .delete(weightEntries)
        .where(and(
          eq(weightEntries.id, weightId),
          eq(weightEntries.petId, petId)
        ))
        .returning();

      if (deletedRows.length === 0) {
        throw new NotFoundError('Weight entry not found');
      }
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to delete weight entry');
    }
  }
}