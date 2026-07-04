import { db } from '../db';
import { weightEntries } from '../db/schema/weight-entries';
import { Pet } from '../db/schema/pets';
import { eq, and, asc } from 'drizzle-orm';
import type { WeightEntry, NewWeightEntry } from '../db/schema/weight-entries';
import { 
  BadRequestError, 
  NotFoundError, 
} from '../middleware/errors';
import { PetsService } from './pets.service';
import { dbLogger } from '../lib/logger';
import { validateUUID } from '@/lib/validateUUID';
import { convertWeight } from '@/shared/utils/units';
import type { WeightFormData, UpdateWeightEntryData } from '@/shared/validations/weight';
import { UserPreferencesService } from './user-preferences.service';

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

  // Input validation helper
  private static validateInputs(entryData: Partial<WeightFormData>, today: string, isUpdate = false): void {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!entryData.weight || !entryData.date) {
        throw new BadRequestError('Weight and date are required');
      }
    }

    // Weight validation (if provided)
    if (entryData.weight !== undefined) {
      const weightValue = parseFloat(entryData.weight.toString());
      if (isNaN(weightValue) || weightValue <= 0) {
        throw new BadRequestError('Weight must be a positive number');
      }
    }

    // Date validation (if provided)
    if (entryData.date !== undefined) {
      if (isNaN(new Date(entryData.date).getTime())) {
        throw new BadRequestError('Invalid date format');
      }
      
      if (entryData.date > today) {
        throw new BadRequestError('Date cannot be in the future');
      }
    }
  }

  // business rules validation helper
  private static validateBusinessRules(weightInKg: number, pet: Pet): void {
    this.validateWeightLimits(weightInKg, pet.animalType);
  }

  // Validate weight (already in kg) against animal-specific realistic ranges
  private static validateWeightLimits(weightInKg: number, animalType: string): void {
    const weightLimits = {
      cat: { min: 0.05, max: 15 },
      dog: { min: 0.5, max: 90 },
    };

    const limits = weightLimits[animalType as keyof typeof weightLimits];

    if (weightInKg < limits.min || weightInKg > limits.max) {
      throw new BadRequestError(
        `Weight is outside realistic range for ${animalType} (${limits.min}-${limits.max}kg)`
      );
    }

    const absoluteMaxKg = 200;
    if (weightInKg > absoluteMaxKg) {
      throw new BadRequestError(`Weight exceeds maximum allowed (${absoluteMaxKg}kg)`);
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
        `Weight entry already exists for ${date}. Use update to modify existing entry.`
      );
    }
  }

  // Get all weight entries for a pet (with ownership check)
  static async getWeightEntries(petId: string, userId: string): Promise<{ weightEntries: WeightEntry[] }> {
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
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching weight entries');
      throw new BadRequestError('Failed to fetch weight entries');
    }
  }

  // Get a single weight entry by ID (with ownership check)
  static async getWeightEntryById(petId: string, weightId: string, userId: string): Promise<WeightEntry> {
    try {
      validateUUID(weightId, 'weight entry ID');
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
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching weight entry by ID');
      throw new BadRequestError('Failed to fetch weight entry');
    }
  }

  // Create a new weight entry 
  static async createWeightEntry(petId: string, userId: string, entryData: WeightFormData): Promise<WeightEntry> {
    try {
      
      // Authorization check
      const pet = await PetsService.getPetById(petId, userId);
      const today = await UserPreferencesService.getTodayForUser(userId);
      
      // Input validation
      this.validateInputs(entryData, today, false);

      // Convert to kg before validation and storage
      const weightInKg = convertWeight(parseFloat(entryData.weight), entryData.weightUnit, 'kg');
      
      // Business logic validation
      this.validateBusinessRules(weightInKg, pet);
      
      //  Database operations
      await this.checkDuplicateDate(petId, entryData.date);
      
      // Execute transaction
      const newEntryData: NewWeightEntry = {
        petId,
        weight: weightInKg.toFixed(3),
        date: entryData.date,
      };

      const [newEntry] = await db
        .insert(weightEntries)
        .values(newEntryData)
        .returning();

      return newEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error creating weight entry');
      throw new BadRequestError('Failed to create weight entry');
    }
  }

  // Update a weight entry
  static async updateWeightEntry(
    petId: string, 
    weightId: string, 
    userId: string, 
    updateData: UpdateWeightEntryData
  ): Promise<WeightEntry> {
    try {
      // Check if at least one field is provided
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      // Authorization & existence check
      const existingEntry = await this.getWeightEntryById(petId, weightId, userId);
      const pet = await PetsService.getPetById(petId, userId);

      const today = await UserPreferencesService.getTodayForUser(userId);

      // Input validation
      this.validateInputs(updateData, today, true);

      // set the DB payload explicitly — weightUnit is never a DB column
      const dbUpdateData: Partial<Pick<NewWeightEntry, 'weight' | 'date'>> = {};

      // updateWeightEntrySchema guarantees weightUnit is present whenever weight is
      if (updateData.weight !== undefined && updateData.weightUnit !== undefined) {
        const weightInKg = convertWeight(parseFloat(updateData.weight), updateData.weightUnit, 'kg');
        this.validateWeightLimits(weightInKg, pet.animalType);
        dbUpdateData.weight = weightInKg.toFixed(3);
      }

      if (updateData.date !== undefined) {
        dbUpdateData.date = updateData.date;
      }

      // Database operations (duplicate check)
      if (updateData.date !== undefined && updateData.date !== existingEntry.date) {
        await this.checkDuplicateDate(petId, updateData.date);
      }

      // Execute update
      const [updatedEntry] = await db
        .update(weightEntries)
        .set({
          ...dbUpdateData,
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
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error updating weight entry');
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
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error deleting weight entry');
      throw new BadRequestError('Failed to delete weight entry');
    }
  }
}