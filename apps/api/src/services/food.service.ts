import { db } from '../db';
import { foodEntries } from '../db/schema/food';
import { pets } from '../db/schema/pets';
import { eq, and, desc } from 'drizzle-orm';
import type { FoodEntry, NewFoodEntry, FoodType } from '../db/schema/food';
import { 
  BadRequestError, 
  NotFoundError, 
  UserForbiddenError 
} from '../middleware/errors';

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

  static async getFoodEntries(petId: string, userId: string): Promise<FoodEntry[]> {
    try {
      await this.verifyPetOwnership(petId, userId);

      const result = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.petId, petId),
          eq(foodEntries.isActive, true)
        ))
        .orderBy(desc(foodEntries.createdAt));

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching food entries:', error);
      throw new BadRequestError('Failed to fetch food entries');
    }
  }

  static async getFoodEntriesByType(petId: string, userId: string, foodType: FoodType): Promise<FoodEntry[]> {
    try {
      await this.verifyPetOwnership(petId, userId);

      const result = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.petId, petId),
          eq(foodEntries.foodType, foodType),
          eq(foodEntries.isActive, true)
        ))
        .orderBy(desc(foodEntries.createdAt));

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching food entries by type:', error);
      throw new BadRequestError('Failed to fetch food entries');
    }
  }

  static async getFoodEntryById(petId: string, foodEntryId: string, userId: string): Promise<FoodEntry> {
    try {
      await this.verifyPetOwnership(petId, userId);

      const [foodEntry] = await db
        .select()
        .from(foodEntries)
        .where(and(
          eq(foodEntries.id, foodEntryId),
          eq(foodEntries.petId, petId),
          eq(foodEntries.isActive, true)
        ));

      if (!foodEntry) {
        throw new NotFoundError('Food entry not found');
      }

      return foodEntry;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching food entry by ID:', error);
      throw new BadRequestError('Failed to fetch food entry');
    }
  }

  static async createFoodEntry(petId: string, userId: string, foodData: NewFoodEntry): Promise<FoodEntry> {
    try {
      await this.verifyPetOwnership(petId, userId);

      if (!foodData.foodType || !foodData.bagWeight || !foodData.dailyAmount || !foodData.datePurchased) {
        throw new BadRequestError('Food type, bag weight, daily amount, and purchase date are required');
      }

      // Validate positive values
      const bagWeight = parseFloat(foodData.bagWeight.toString());
      const dailyAmount = parseFloat(foodData.dailyAmount.toString());
      
      if (bagWeight <= 0 || dailyAmount <= 0) {
        throw new BadRequestError('Bag weight and daily amount must be positive values');
      }

      // Validate date is not in the future
      const purchaseDate = new Date(foodData.datePurchased);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (purchaseDate > today) {
        throw new BadRequestError('Purchase date cannot be in the future');
      }

      // Clean the data (convert empty strings to null)
      const cleanedData: NewFoodEntry = {
        ...foodData,
        petId,
        brandName: foodData.brandName || null,
        productName: foodData.productName || null,
      };

      const [newFoodEntry] = await db
        .insert(foodEntries)
        .values(cleanedData)
        .returning();

      return newFoodEntry;
    } catch (error) {
      console.error('Error creating food entry:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to create food entry');
    }
  }

  static async updateFoodEntry(
    petId: string, 
    foodEntryId: string, 
    userId: string, 
    updateData: Partial<NewFoodEntry>
  ): Promise<FoodEntry> {
    try {
      await this.getFoodEntryById(petId, foodEntryId, userId);

      // Validate positive values if provided
      if (updateData.bagWeight !== undefined) {
        const bagWeight = parseFloat(updateData.bagWeight.toString());
        if (bagWeight <= 0) {
          throw new BadRequestError('Bag weight must be a positive value');
        }
      }

      if (updateData.dailyAmount !== undefined) {
        const dailyAmount = parseFloat(updateData.dailyAmount.toString());
        if (dailyAmount <= 0) {
          throw new BadRequestError('Daily amount must be a positive value');
        }
      }

      // Validate date is not in the future if provided
      if (updateData.datePurchased !== undefined) {
        const purchaseDate = new Date(updateData.datePurchased);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (purchaseDate > today) {
          throw new BadRequestError('Purchase date cannot be in the future');
        }
      }

      // Clean the update data
      const cleanedData: Partial<NewFoodEntry> = {
        ...updateData,
        brandName: updateData.brandName === '' ? null : updateData.brandName,
        productName: updateData.productName === '' ? null : updateData.productName,
        updatedAt: new Date(),
      };

      const [updatedFoodEntry] = await db
        .update(foodEntries)
        .set(cleanedData)
        .where(eq(foodEntries.id, foodEntryId))
        .returning();

      return updatedFoodEntry;
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating food entry:', error);
      throw new BadRequestError('Failed to update food entry');
    }
  }

  // Soft delete a food entry
  static async deleteFoodEntry(petId: string, foodEntryId: string, userId: string): Promise<void> {
    try {
      await this.getFoodEntryById(petId, foodEntryId, userId);

      await db
        .update(foodEntries)
        .set({ 
          isActive: false, 
          updatedAt: new Date() 
        })
        .where(eq(foodEntries.id, foodEntryId));

    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error deleting food entry:', error);
      throw new BadRequestError('Failed to delete food entry');
    }
  }

  // Calculate remaining food
  static calculateFoodRemaining(foodEntry: FoodEntry): { remainingDays: number; depletionDate: Date; remainingWeight: number } {
    const today = new Date();
    const purchaseDate = new Date(foodEntry.datePurchased);
    
    const daysSincePurchase = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const bagWeight = parseFloat(foodEntry.bagWeight.toString());
    const dailyAmount = parseFloat(foodEntry.dailyAmount.toString());
    const foodConsumed = Math.max(0, daysSincePurchase * dailyAmount);
    
    const remainingWeight = Math.max(0, bagWeight - foodConsumed);
    
    const remainingDays = dailyAmount > 0 ? Math.floor(remainingWeight / dailyAmount) : 0;
    
    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + remainingDays);
    
    return {
      remainingDays,
      depletionDate,
      remainingWeight
    };
  }
}