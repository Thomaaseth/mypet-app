import { db } from '../../db';
import { foodEntries } from '../../db/schema/food';
import { pets } from '../../db/schema/pets';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  DryFoodEntry, 
  WetFoodEntry, 
  AnyFoodEntry,
  FoodType 
} from '../../db/schema/food';
import { 
  BadRequestError, 
  NotFoundError 
} from '../../middleware/errors';
import { FoodValidations } from './validations';
import { FoodCalculations } from './calculations';
import type { DryFoodFormData, WetFoodFormData } from './types';

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
  static calculateDryFoodRemaining(entry: DryFoodEntry) {
    return FoodCalculations.calculateDryFoodRemaining(entry);
  }
  
  static calculateWetFoodRemaining(entry: WetFoodEntry) {
    return FoodCalculations.calculateWetFoodRemaining(entry);
  }

  // DRY FOOD METHODS //
  // Create DRY food entry
  static async createDryFoodEntry(petId: string, userId: string, data: DryFoodFormData): Promise<DryFoodEntry> {
    try {
      // Input validation 
      FoodValidations.validateDryFoodInputs(data, false);
      
      // Authorization check
      await this.verifyPetOwnership(petId, userId);
      
      // Execute db transaction
      const [newEntry] = await db
        .insert(foodEntries)
        .values({
          petId,
          foodType: 'dry',
          brandName: data.brandName || null,
          productName: data.productName || null,
          bagWeight: data.bagWeight,
          bagWeightUnit: data.bagWeightUnit,
          dailyAmount: data.dailyAmount,
          dryDailyAmountUnit: data.dryDailyAmountUnit,
          datePurchased: data.datePurchased,
          // Explicitly set wet food fields to null
          numberOfUnits: null,
          weightPerUnit: null,
          wetWeightUnit: null,
          wetDailyAmountUnit: null,
        })
        .returning();

      return newEntry as DryFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error creating dry food entry:', error);
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
        ))
        .orderBy(desc(foodEntries.createdAt));
  
      // calculations only, don't update database
      return result.map(entry => {
        const calculations = FoodCalculations.calculateDryFoodRemaining(entry as DryFoodEntry);
        return { ...entry, ...calculations };
      }) as DryFoodEntry[];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching dry food entries:', error);
      throw new BadRequestError('Failed to fetch dry food entries');
    }
  }

  // Update DRY food entry
  static async updateDryFoodEntry(petId: string, foodId: string, userId: string, data: Partial<DryFoodFormData>): Promise<DryFoodEntry> {
    try {
      // Input validation
      FoodValidations.validateUUID(foodId, 'food entry ID');
      
      if (Object.keys(data).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      FoodValidations.validateDryFoodInputs(data, true);
      
      // Authorization & existence check
      await this.verifyPetOwnership(petId, userId);
      const existing = await this.getDryFoodEntryById(petId, foodId, userId);
      
      // Execute update
      const updateData = {
        ...data,
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
      const calculations = FoodCalculations.calculateDryFoodRemaining(updatedEntry as DryFoodEntry);
      return { ...updatedEntry, ...calculations } as DryFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating dry food entry:', error);
      throw new BadRequestError('Failed to update dry food entry');
    }
  }

  static async getDryFoodEntryById(petId: string, foodId: string, userId: string): Promise<DryFoodEntry> {
    try {
      FoodValidations.validateUUID(foodId, 'food entry ID')
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
      const calculations = FoodCalculations.calculateDryFoodRemaining(entry as DryFoodEntry);
      return { ...entry, ...calculations } as DryFoodEntry;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error fetching dry food entry:', error);
      throw new BadRequestError('Failed to fetch dry food entry');
    }
  }

  // WET FOOD METHODS //
  // Create WET food entry
  static async createWetFoodEntry(petId: string, userId: string, data: WetFoodFormData): Promise<WetFoodEntry> {
    try {
      // Input validation
      FoodValidations.validateWetFoodInputs(data, false);
      
      // uthorization check
      await this.verifyPetOwnership(petId, userId);
      
      // Execute db transaction
      const [newEntry] = await db
        .insert(foodEntries)
        .values({
          petId,
          foodType: 'wet',
          brandName: data.brandName || null,
          productName: data.productName || null,
          numberOfUnits: parseInt(data.numberOfUnits, 10),
          weightPerUnit: data.weightPerUnit,
          wetWeightUnit: data.wetWeightUnit,
          dailyAmount: data.dailyAmount,
          wetDailyAmountUnit: data.wetDailyAmountUnit,
          datePurchased: data.datePurchased,
          // Explicitly set dry food fields to null
          bagWeight: null,
          bagWeightUnit: null,
          dryDailyAmountUnit: null,
        })
        .returning();

      return newEntry as WetFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error creating wet food entry:', error);
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
        ))
        .orderBy(desc(foodEntries.createdAt));
  
      // CHANGED: Just add calculations, don't update database
      return result.map(entry => {
        const calculations = FoodCalculations.calculateWetFoodRemaining(entry as WetFoodEntry);
        return { ...entry, ...calculations };
      }) as WetFoodEntry[];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching wet food entries:', error);
      throw new BadRequestError('Failed to fetch wet food entries');
    }
  }

  // Update WET food entry
  static async updateWetFoodEntry(petId: string, foodId: string, userId: string, data: Partial<WetFoodFormData>): Promise<WetFoodEntry> {
    try {
      // 🔒 STEP 1: Input validation (fail fast)
      FoodValidations.validateUUID(foodId, 'food entry ID');
      
      if (Object.keys(data).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      FoodValidations.validateWetFoodInputs(data, true);
      
      // Authorization check
      await this.verifyPetOwnership(petId, userId);
      const existing = await this.getWetFoodEntryById(petId, foodId, userId);
      
      // Execute update
      const updateData = {
        ...data,
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
      const calculations = FoodCalculations.calculateWetFoodRemaining(updatedEntry as WetFoodEntry);
      return { ...updatedEntry, ...calculations } as WetFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating wet food entry:', error);
      throw new BadRequestError('Failed to update wet food entry');
    }
  }

  static async getWetFoodEntryById(petId: string, foodId: string, userId: string): Promise<WetFoodEntry> {
    try {
      FoodValidations.validateUUID(foodId, 'food entry ID')
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

      const calculations = FoodCalculations.calculateWetFoodRemaining(entry as WetFoodEntry);
      return { ...entry, ...calculations } as WetFoodEntry;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error fetching wet food entry:', error);
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
  
      return result.map(entry => {
        let calculations;
        if (entry.foodType === 'dry') {
          calculations = FoodCalculations.calculateDryFoodRemaining(entry as DryFoodEntry);
        } else {
          calculations = FoodCalculations.calculateWetFoodRemaining(entry as WetFoodEntry);
        }
        return { ...entry, ...calculations };
      }) as AnyFoodEntry[];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching all food entries:', error);
      throw new BadRequestError('Failed to fetch food entries');
    }
  }

  static async deleteFoodEntry(petId: string, foodId: string, userId: string): Promise<void> {
    try {
      // Input validation
      FoodValidations.validateUUID(foodId, 'food entry ID');
      
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
      console.error('Error deleting food entry:', error);
      throw new BadRequestError('Failed to delete food entry');
    }
  }

  static async getFinishedFoodEntries(
    petId: string, 
    userId: string, 
    foodType?: 'dry' | 'wet',
    limit: number = 5
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
        .orderBy(desc(foodEntries.updatedAt))
        .limit(limit);
  
      return result as (DryFoodEntry | WetFoodEntry)[];
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching finished food entries:', error);
      throw new BadRequestError('Failed to fetch finished food entries');
    }
  }

  static async markFoodAsFinished(petId: string, foodId: string, userId: string): Promise<DryFoodEntry | WetFoodEntry> {
    try {
      FoodValidations.validateUUID(foodId, 'food entry ID');
      await this.verifyPetOwnership(petId, userId);
  
      const [updatedEntry] = await db
        .update(foodEntries)
        .set({ 
          isActive: false,
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
  
      // Return with calculations
      let calculations;
      if (updatedEntry.foodType === 'dry') {
        calculations = FoodCalculations.calculateDryFoodRemaining(updatedEntry as DryFoodEntry);
      } else {
        calculations = FoodCalculations.calculateWetFoodRemaining(updatedEntry as WetFoodEntry);
      }
  
      return { ...updatedEntry, ...calculations } as DryFoodEntry | WetFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error marking food as finished:', error);
      throw new BadRequestError('Failed to mark food as finished');
    }
  }
}