import { db } from '../../db';
import { foodEntries } from '../../db/schema/food';
import { pets } from '../../db/schema/pets';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  DryFoodEntry, 
  WetFoodEntry, 
  AnyFoodEntry,
} from '../../db/schema/food';
import { 
  BadRequestError, 
  NotFoundError 
} from '../../middleware/errors';
import { FoodValidations } from './validations';
import { FoodCalculations } from './calculations';
import type { DryFoodFormData, WetFoodFormData } from './types';
import { dbLogger } from '../../lib/logger';
import { validateUUID } from '@/lib/validateUUID';
import { UserPreferencesService } from '../user-preferences.service';
import { convertFoodWeight } from '@/shared/utils/units';


export class FoodService {
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
      throw new NotFoundError('Pet not found');
    }
  }
  // Export calculations methods
  static async calculateDryFoodRemaining(entry: DryFoodEntry, userId: string) {
    const today = await UserPreferencesService.getTodayForUser(userId);
    return FoodCalculations.calculateDryFoodRemaining(entry, today);
  }
  
  static async calculateWetFoodRemaining(entry: WetFoodEntry, userId: string) {
    const today = await UserPreferencesService.getTodayForUser(userId);
    return FoodCalculations.calculateWetFoodRemaining(entry, today);
  }

  // DRY FOOD METHODS //
  // Create DRY food entry
  static async createDryFoodEntry(petId: string, userId: string, data: DryFoodFormData): Promise<DryFoodEntry> {
    try {
      // Authorization check
      await this.verifyPetOwnership(petId, userId);

      const today = await UserPreferencesService.getTodayForUser(userId);

      // Input validation 
      FoodValidations.validateDryFoodInputs(data, today, false);
      
      // Check if there's already an active dry food entry
      const [existingActiveEntry] = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, 'dry'),
          eq(foodEntries.isActive, true)
        ))
        .limit(1);

    if (existingActiveEntry) {
      throw new BadRequestError('You already have an active dry food entry. Please finish or delete the existing entry before adding a new one.');
    }

      const bagWeightInGrams = convertFoodWeight(
        parseFloat(data.bagWeight),
        data.bagWeightUnit,
        'grams'
      );
      
      // Execute db transaction
      const [newEntry] = await db
        .insert(foodEntries)
        .values({
          petId,
          foodType: 'dry',
          brandName: data.brandName || null,
          productName: data.productName || null,
          bagWeight: bagWeightInGrams.toFixed(2),
          dailyAmount: data.dailyAmount,
          dateStarted: data.dateStarted,
          // Explicitly set wet food fields to null
          numberOfUnits: null,
          weightPerUnit: null,
        })
        .returning();

      return newEntry as DryFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error creating dry food entry');
      throw new BadRequestError('Failed to create dry food entry');
    }
  }

  static async getDryFoodEntries(petId: string, userId: string): Promise<DryFoodEntry[]> {
    try {
      await this.verifyPetOwnership(petId, userId);
  
      const result = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, 'dry'),
          eq(foodEntries.isActive, true)
        ))
        .orderBy(desc(foodEntries.createdAt));
  
      // calculations only, don't update database
      const today = await UserPreferencesService.getTodayForUser(userId);
      return result.map(entry => {
        const calculations = FoodCalculations.calculateDryFoodRemaining(entry as DryFoodEntry, today);
        return { ...entry, ...calculations };
      }) as DryFoodEntry[];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching dry food entries');
      throw new BadRequestError('Failed to fetch dry food entries');
    }
  }

  // Update DRY food entry
  static async updateDryFoodEntry(petId: string, foodId: string, userId: string, data: Partial<DryFoodFormData>): Promise<DryFoodEntry> {
    try {
      // Input validation
      validateUUID(foodId, 'food entry ID');
      
      if (Object.keys(data).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }

      // Authorization & existence check
      await this.verifyPetOwnership(petId, userId);
      const existing = await this.getDryFoodEntryById(petId, foodId, userId);
      const today = await UserPreferencesService.getTodayForUser(userId);

      FoodValidations.validateDryFoodInputs(data, today, true);
         
      // Execute update
      // canonical grams before storage, then discarded from the update payload.
      const { bagWeightUnit, ...restData } = data;
      const updateData = {
        ...restData,
        ...(data.bagWeight !== undefined && bagWeightUnit !== undefined && {
          bagWeight: convertFoodWeight(parseFloat(data.bagWeight), bagWeightUnit, 'grams').toFixed(2),
        }),
        brandName: data.brandName !== undefined ? (data.brandName || null) : undefined,
        productName: data.productName !== undefined ? (data.productName || null) : undefined,
        updatedAt: new Date(),
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const [updatedEntry] = await db
        .update(foodEntries)
        .set(cleanedData)
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, 'dry'),
          eq(foodEntries.isActive, true)
        ))
        .returning();

      if (!updatedEntry) {
        throw new NotFoundError('Dry food entry not found');
      }
      const calculations = FoodCalculations.calculateDryFoodRemaining(updatedEntry as DryFoodEntry, today);
      return { ...updatedEntry, ...calculations } as DryFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error updating dry food entry');
      throw new BadRequestError('Failed to update dry food entry');
    }
  }

  static async getDryFoodEntryById(petId: string, foodId: string, userId: string): Promise<DryFoodEntry> {
    try {
      validateUUID(foodId, 'food entry ID')
      await this.verifyPetOwnership(petId, userId);

      const [entry] = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, 'dry'),
          eq(foodEntries.isActive, true)
        ));

      if (!entry) {
        throw new NotFoundError('Dry food entry not found');
      }
      const today = await UserPreferencesService.getTodayForUser(userId);
      const calculations = FoodCalculations.calculateDryFoodRemaining(entry as DryFoodEntry, today);
      return { ...entry, ...calculations } as DryFoodEntry;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching dry food entry');
      throw new BadRequestError('Failed to fetch dry food entry');
    }
  }

  // WET FOOD METHODS //
  // Create WET food entry
  static async createWetFoodEntry(petId: string, userId: string, data: WetFoodFormData): Promise<WetFoodEntry> {
    try {
    // uthorization check
    await this.verifyPetOwnership(petId, userId);

    const today = await UserPreferencesService.getTodayForUser(userId);

    // Input validation
    FoodValidations.validateWetFoodInputs(data, today, false);
      
    // Check if there's already an active wet food entry
    const [existingActiveEntry] = await db
      .select()
      .from(foodEntries)
      .where(and(
        eq(foodEntries.petId, petId),
        eq(foodEntries.foodType, 'wet'),
        eq(foodEntries.isActive, true)
      ))
      .limit(1);

    if (existingActiveEntry) {
    throw new BadRequestError('You already have an active wet food entry. Please finish or delete the existing entry before adding a new one.');
    }

      const weightPerUnitInGrams = convertFoodWeight(parseFloat(data.weightPerUnit), data.wetFoodUnit, 'grams');
      const dailyAmountInGrams = convertFoodWeight(parseFloat(data.dailyAmount), data.wetFoodUnit, 'grams');

      
      // Execute db transaction
      const [newEntry] = await db
        .insert(foodEntries)
        .values({
          petId,
          foodType: 'wet',
          brandName: data.brandName || null,
          productName: data.productName || null,
          numberOfUnits: parseInt(data.numberOfUnits, 10),
          weightPerUnit: weightPerUnitInGrams.toFixed(2),
          dailyAmount: dailyAmountInGrams.toFixed(2),
          dateStarted: data.dateStarted,
          // Explicitly set dry food fields to null
          bagWeight: null,
        })
        .returning();

      return newEntry as WetFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error creating wet food entry');
      throw new BadRequestError('Failed to create wet food entry');
    }
  }

  static async getWetFoodEntries(petId: string, userId: string): Promise<WetFoodEntry[]> {
    try {
      await this.verifyPetOwnership(petId, userId);
  
      const result = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, 'wet'),
          eq(foodEntries.isActive, true)
        ))
        .orderBy(desc(foodEntries.createdAt));
  
      // CHANGED: Just add calculations, don't update database
      const today = await UserPreferencesService.getTodayForUser(userId);
      return result.map(entry => {
        const calculations = FoodCalculations.calculateWetFoodRemaining(entry as WetFoodEntry, today);
        return { ...entry, ...calculations };
      }) as WetFoodEntry[];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching wet food entries');
      throw new BadRequestError('Failed to fetch wet food entries');
    }
  }

  // Update WET food entry
  static async updateWetFoodEntry(petId: string, foodId: string, userId: string, data: Partial<WetFoodFormData>): Promise<WetFoodEntry> {
    try {
      // Input validation
      validateUUID(foodId, 'food entry ID');
      
      if (Object.keys(data).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }

      // Authorization check
      await this.verifyPetOwnership(petId, userId);
      const existing = await this.getWetFoodEntryById(petId, foodId, userId);
      const today = await UserPreferencesService.getTodayForUser(userId);

      FoodValidations.validateWetFoodInputs(data, today, true);    
      
      // Execute update
      // convert to canonical grams before storage, then discarded from the update payload.
      const { wetFoodUnit, ...restData } = data;
      const updateData = {
        ...restData,
        ...(data.weightPerUnit !== undefined && wetFoodUnit !== undefined && {
          weightPerUnit: convertFoodWeight(parseFloat(data.weightPerUnit), wetFoodUnit, 'grams').toFixed(2),
        }),
        ...(data.dailyAmount !== undefined && wetFoodUnit !== undefined && {
          dailyAmount: convertFoodWeight(parseFloat(data.dailyAmount), wetFoodUnit, 'grams').toFixed(2),
        }),
        brandName: data.brandName !== undefined ? (data.brandName || null) : undefined,
        productName: data.productName !== undefined ? (data.productName || null) : undefined,
        updatedAt: new Date(),
      };

      // Remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const [updatedEntry] = await db
        .update(foodEntries)
        .set(cleanedData)
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, 'wet'),
          eq(foodEntries.isActive, true)
        ))
        .returning();

      if (!updatedEntry) {
        throw new NotFoundError('Wet food entry not found');
      }
      const calculations = FoodCalculations.calculateWetFoodRemaining(updatedEntry as WetFoodEntry, today);
      return { ...updatedEntry, ...calculations } as WetFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error updating wet food entry');
      throw new BadRequestError('Failed to update wet food entry');
    }
  }

  static async getWetFoodEntryById(petId: string, foodId: string, userId: string): Promise<WetFoodEntry> {
    try {
      validateUUID(foodId, 'food entry ID')
      await this.verifyPetOwnership(petId, userId);

      const [entry] = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, 'wet'),
          eq(foodEntries.isActive, true)
        ));

      if (!entry) {
        throw new NotFoundError('Wet food entry not found');
      }
      const today = await UserPreferencesService.getTodayForUser(userId);
      const calculations = FoodCalculations.calculateWetFoodRemaining(entry as WetFoodEntry, today);
      return { ...entry, ...calculations } as WetFoodEntry;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching wet food entry');
      throw new BadRequestError('Failed to fetch wet food entry');
    }
  }

  // COMBINED METHODS //
  static async getAllFoodEntries(petId: string, userId: string): Promise<AnyFoodEntry[]> {
    try {
      await this.verifyPetOwnership(petId, userId);
  
      const result = await db
        .select()
        .from(foodEntries)
        .where(eq(foodEntries.petId, petId))
        .orderBy(desc(foodEntries.createdAt));

      const today = await UserPreferencesService.getTodayForUser(userId);
      return result.map(entry => {
        let calculations;
        if (entry.foodType === 'dry') {
          calculations = FoodCalculations.calculateDryFoodRemaining(entry as DryFoodEntry, today);
        } else {
          calculations = FoodCalculations.calculateWetFoodRemaining(entry as WetFoodEntry, today);
        }
        return { ...entry, ...calculations };
      }) as AnyFoodEntry[];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching all food entries');
      throw new BadRequestError('Failed to fetch food entries');
    }
  }

  static async deleteFoodEntry(petId: string, foodId: string, userId: string): Promise<void> {
    try {
      // Input validation
      validateUUID(foodId, 'food entry ID');
      
      // Authorization check
      await this.verifyPetOwnership(petId, userId);

      // Check existence
      const [entry] = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId),
        ));

      if (!entry) {
        throw new NotFoundError('Food entry not found');
      }

      // Execute deletion
      await db
        .delete(foodEntries)
        .where(eq(foodEntries.id, foodId));

    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error deleting food entry');
      throw new BadRequestError('Failed to delete food entry');
    }
  }

  static async getFinishedFoodEntries(
    petId: string, 
    userId: string, 
    foodType?: 'dry' | 'wet',
    limit: number = 50
  ): Promise<(DryFoodEntry | WetFoodEntry)[]> {
    try {
      // Validate limit parameter
      if (limit <= 0 || limit > 100) {
        throw new BadRequestError('Limit must be between 1 and 100');
      }

      await this.verifyPetOwnership(petId, userId);
  
      const whereConditions = [
        eq(foodEntries.petId, petId),
        eq(foodEntries.isActive, false)
      ];
  
      if (foodType) {
        if (!['dry', 'wet'].includes(foodType)) {
          throw new BadRequestError('Food type must be either dry or wet');
        }
        whereConditions.push(eq(foodEntries.foodType, foodType));
      }
  
      const result = await db
        .select()
        .from(foodEntries)
        .where(and(...whereConditions))
        .orderBy(desc(foodEntries.dateFinished))
        .limit(limit);
  
      // Calculate actual consumption for each finished entry
      return result.map(entry => ({
        ...entry,
        ...FoodCalculations.calculateActualConsumption(entry as DryFoodEntry | WetFoodEntry)
      })) as (DryFoodEntry | WetFoodEntry)[];
      } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching finished food entries');
      throw new BadRequestError('Failed to fetch finished food entries');
      }
  }

  static async markFoodAsFinished(
    petId: string, 
    foodId: string, 
    userId: string
  ): Promise<DryFoodEntry | WetFoodEntry> {
    try {
      validateUUID(foodId, 'food entry ID');
      await this.verifyPetOwnership(petId, userId);
  
      const [updatedEntry] = await db
        .update(foodEntries)
        .set({ 
          isActive: false,
          dateFinished: await UserPreferencesService.getTodayForUser(userId),
          updatedAt: new Date()
        })
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId),
          eq(foodEntries.isActive, true)
        ))
        .returning();
  
      if (!updatedEntry) {
        throw new NotFoundError('Active food entry not found');
      }
  
      // Return with actual consumption calculations
      return {
        ...updatedEntry,
        ...FoodCalculations.calculateActualConsumption(updatedEntry as DryFoodEntry | WetFoodEntry)
      } as DryFoodEntry | WetFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error marking food as finished');
      throw new BadRequestError('Failed to mark food as finished');
    }
  }

  
  //Update the finish date (ONLY) of a finished food entry
  static async updateFinishDate(
    petId: string,
    foodId: string,
    userId: string,
    newDate: string
  ): Promise<DryFoodEntry | WetFoodEntry> {
    try {
      // Validations
      validateUUID(foodId, 'food entry ID');
      
      await this.verifyPetOwnership(petId, userId);
      
      // Get the entry and verify it's finished
      const [entry] = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId)
        ));
      
      if (!entry) {
        throw new NotFoundError('Food entry not found');
      }
      
      if (entry.isActive) {
        throw new BadRequestError('Cannot update finish date of active entry');
      }

      const dateFinishedString = newDate;

      // Lower bound: plain string comparison, both values are "YYYY-MM-DD" —
      if (dateFinishedString < entry.dateStarted) {
        throw new BadRequestError(
          `Finish date cannot be before start date (${entry.dateStarted})`
        );
      }
      
      const todayForUser = await UserPreferencesService.getTodayForUser(userId);

      if (dateFinishedString > todayForUser) {
        throw new BadRequestError('Finish date cannot be in the future');
      }
      
      // Update ONLY dateFinished
      const [updatedEntry] = await db
        .update(foodEntries)
        .set({ 
          dateFinished: dateFinishedString,
          updatedAt: new Date()
        })
        .where(and(
          eq(foodEntries.id, foodId),
          eq(foodEntries.petId, petId)
        ))
        .returning();
      
      if (!updatedEntry) {
        throw new NotFoundError('Food entry not found');
      }
      
      // Return with recalculated values
      return {
        ...updatedEntry,
        ...FoodCalculations.calculateActualConsumption(updatedEntry as DryFoodEntry | WetFoodEntry)
      } as DryFoodEntry | WetFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error updating finish date');
      throw new BadRequestError('Failed to update finish date');
    }
  }
}