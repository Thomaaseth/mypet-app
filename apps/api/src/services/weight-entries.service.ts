import { db } from '../db';
import { weightEntries } from '../db/schema/weight-entries';
import { pets } from '../db/schema/pets';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { WeightEntry, NewWeightEntry, WeightEntryFormData, WeightUnit } from '../db/schema/weight-entries';
import { 
  BadRequestError, 
  NotFoundError, 
  UserForbiddenError 
} from '../middleware/errors';
import { PetsService } from './pets.service';
import { dbLogger } from '../lib/logger';

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
  private static validateInputs(entryData: Partial<WeightEntryFormData>, isUpdate = false): void {
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
      const entryDate = new Date(entryData.date);
      if (isNaN(entryDate.getTime())) {
        throw new BadRequestError('Invalid date format');
      }

      // Future date validation
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (entryDate > today) {
        throw new BadRequestError('Date cannot be in the future');
      }
    }
  }

  // business rules validation helper
  private static validateBusinessRules(entryData: WeightEntryFormData, pet: any): void {
    const weightValue = parseFloat(entryData.weight.toString());
    this.validateWeightLimits(weightValue, pet.animalType, entryData.weightUnit);
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
      cat: { min: 0.05, max: 15 }, // 0.05-15kg
      dog: { min: 0.5, max: 90 }, // 0.5-90kg
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

    // enforce absolute maximum of 200kg regardless of animal type
    const absoluteMaxKg = 200;
    const absoluteMaxDisplay = weightUnit === 'kg' ? '200kg' : '440lbs';
    
    if (weightInKg > absoluteMaxKg) {
      throw new BadRequestError(`Weight exceeds maximum allowed (${absoluteMaxDisplay})`);
    }
  }

  private static validateUUID(id: string, fieldName: string = 'ID'): void {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestError(`Invalid ${fieldName} format`);
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
  static async getWeightEntries(petId: string, userId: string): Promise<{ weightEntries: WeightEntry[], weightUnit: WeightUnit }> {
    try {
      // Verify pet ownership first
      const pet = await PetsService.getPetById(petId, userId);

      const entries = await db
        .select()
        .from(weightEntries)
        .where(eq(weightEntries.petId, petId))
        .orderBy(asc(weightEntries.date)); // Order by date for chart display
      
      const weightUnit = entries.length > 0 ? entries[entries.length - 1].weightUnit : 'kg';

      return {
        weightEntries: entries,
        weightUnit: weightUnit
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
      this.validateUUID(weightId, 'weight entry ID');
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
  static async createWeightEntry(petId: string, userId: string, entryData: WeightEntryFormData): Promise<WeightEntry> {
    try {
      // Input validation
      this.validateInputs(entryData, false);
      
      // Authorization check
      const pet = await PetsService.getPetById(petId, userId);
      
      // Business logic validation
      this.validateBusinessRules(entryData, pet);
      
      //  Database operations
      await this.checkDuplicateDate(petId, entryData.date);
      
      // Execute transaction
      const newEntryData: NewWeightEntry = {
        petId,
        weight: entryData.weight,
        weightUnit: entryData.weightUnit,
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
    updateData: Partial<WeightEntryFormData>
  ): Promise<WeightEntry> {
    try {
      // Input validation
      this.validateInputs(updateData, true);

      // Check if at least one field is provided
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      // Authorization & existence check
      const existingEntry = await this.getWeightEntryById(petId, weightId, userId);
      const pet = await PetsService.getPetById(petId, userId);

      // Business logic validation for weight
      if (updateData.weight !== undefined) {
        const weightValue = parseFloat(updateData.weight.toString());
        // Use the weight unit from the existing entry
        this.validateWeightLimits(weightValue, pet.animalType, existingEntry.weightUnit);
      }

      // Database operations (duplicate check)
      if (updateData.date !== undefined && updateData.date !== existingEntry.date) {
        await this.checkDuplicateDate(petId, updateData.date);
      }

      // Execute update
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