import { db } from '../db';
import { foodEntries } from '../db/schema/food';
import { pets } from '../db/schema/pets';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  DryFoodEntry, 
  WetFoodEntry, 
  AnyFoodEntry,
  FoodType 
} from '../db/schema/food';
import { 
  BadRequestError, 
  NotFoundError 
} from '../middleware/errors';

export type DryFoodFormData = {
  brandName?: string;
  productName?: string;
  bagWeight: string;
  bagWeightUnit: 'kg' | 'pounds';
  dailyAmount: string;
  dryDailyAmountUnit: 'grams' | 'cups';
  datePurchased: string;
};

export type WetFoodFormData = {
  brandName?: string;
  productName?: string;
  numberOfUnits: string; // String from form
  weightPerUnit: string;
  wetWeightUnit: 'grams' | 'oz';
  dailyAmount: string;
  wetDailyAmountUnit: 'grams' | 'oz';
  datePurchased: string;
};

export class FoodService {
  static async processEntryForResponse(entry: DryFoodEntry | WetFoodEntry): Promise<DryFoodEntry | WetFoodEntry> {
    return await this.updateFoodActiveStatus(entry);
  }

  // Centralized input validation helpers
  private static validateCommonInputs(data: { datePurchased?: string; brandName?: string; productName?: string }): void {
    // Date format validation
    if (data.datePurchased !== undefined) {
      const purchaseDate = new Date(data.datePurchased);
      if (isNaN(purchaseDate.getTime())) {
        throw new BadRequestError('Invalid date format for purchase date');
      }

      // Future date validation
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (purchaseDate > today) {
        throw new BadRequestError('Purchase date cannot be in the future');
      }
    }

    // Optional string length validation
    if (data.brandName && data.brandName.length > 100) {
      throw new BadRequestError('Brand name must be 100 characters or less');
    }
    if (data.productName && data.productName.length > 100) {
      throw new BadRequestError('Product name must be 100 characters or less');
    }
  }

  private static validateDryFoodInputs(data: Partial<DryFoodFormData>, isUpdate = false): void {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!data.bagWeight || !data.bagWeightUnit || !data.dailyAmount || !data.dryDailyAmountUnit || !data.datePurchased) {
        throw new BadRequestError('Bag weight, bag weight unit, daily amount, daily amount unit, and purchase date are required for dry food');
      }
    }

    // Validate bag weight unit
    if (data.bagWeightUnit !== undefined && !['kg', 'pounds'].includes(data.bagWeightUnit)) {
      throw new BadRequestError('Invalid bag weight unit for dry food. Must be kg or pounds');
    }

    // Validate daily amount unit
    if (data.dryDailyAmountUnit !== undefined && !['grams', 'cups'].includes(data.dryDailyAmountUnit)) {
      throw new BadRequestError('Invalid daily amount unit for dry food. Must be grams or cups');
    }

    // Validate numeric values
    if (data.bagWeight !== undefined) {
      const bagWeight = parseFloat(data.bagWeight);
      if (isNaN(bagWeight) || bagWeight <= 0) {
        throw new BadRequestError('Bag weight must be a positive number');
      }

    // Unit-specific upper limits
    if (data.bagWeightUnit === 'kg' && bagWeight > 50) {
      throw new BadRequestError('Bag weight seems unreasonably large (max 50kg)');
    }
    if (data.bagWeightUnit === 'pounds' && bagWeight > 110) { // ~50kg
      throw new BadRequestError('Bag weight seems unreasonably large (max 110 pounds)');
    }
    }

    if (data.dailyAmount !== undefined) {
      const dailyAmount = parseFloat(data.dailyAmount);
      if (isNaN(dailyAmount) || dailyAmount <= 0) {
        throw new BadRequestError('Daily amount must be a positive number');
      }
      // Reasonable upper limits based on unit
      if (data.dryDailyAmountUnit === 'grams' && dailyAmount > 2000) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 2000 grams)');
      }
      if (data.dryDailyAmountUnit === 'cups' && dailyAmount > 16) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 16 cups)');
      }
    }

    // Validate common fields
    this.validateCommonInputs(data);
  }

  private static validateWetFoodInputs(data: Partial<WetFoodFormData>, isUpdate = false): void {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!data.numberOfUnits || !data.weightPerUnit || !data.wetWeightUnit || 
          !data.dailyAmount || !data.wetDailyAmountUnit || !data.datePurchased) {
        throw new BadRequestError('Number of units, weight per unit, weight unit, daily amount, daily amount unit, and purchase date are required for wet food');
      }
    }

    // Validate weight units
    if (data.wetWeightUnit !== undefined && !['grams', 'oz'].includes(data.wetWeightUnit)) {
      throw new BadRequestError('Invalid weight unit for wet food. Must be grams or oz');
    }

    if (data.wetDailyAmountUnit !== undefined && !['grams', 'oz'].includes(data.wetDailyAmountUnit)) {
      throw new BadRequestError('Invalid daily amount unit for wet food. Must be grams or oz');
    }

    // Validate numeric values
    if (data.numberOfUnits !== undefined) {
      const numberOfUnits = parseInt(data.numberOfUnits, 10);
      if (!Number.isInteger(numberOfUnits) || numberOfUnits <= 0 || isNaN(numberOfUnits)) {
        throw new BadRequestError('Number of units must be a positive integer');
      }
      if (numberOfUnits > 1000) { // Reasonable upper limit
        throw new BadRequestError('Number of units seems unreasonably large (max 1000)');
      }
    }

    if (data.weightPerUnit !== undefined) {
      const weightPerUnit = parseFloat(data.weightPerUnit);
      if (isNaN(weightPerUnit) || weightPerUnit <= 0) {
        throw new BadRequestError('Weight per unit must be a positive number');
      }
      // Reasonable upper limits based on unit
      if (data.wetWeightUnit === 'grams' && weightPerUnit > 5000) {
        throw new BadRequestError('Weight per unit seems unreasonably large (max 5000 grams)');
      }
      if (data.wetWeightUnit === 'oz' && weightPerUnit > 176) { // ~5000g
        throw new BadRequestError('Weight per unit seems unreasonably large (max 176 oz)');
      }
    }

    if (data.dailyAmount !== undefined) {
      const dailyAmount = parseFloat(data.dailyAmount);
      if (isNaN(dailyAmount) || dailyAmount <= 0) {
        throw new BadRequestError('Daily amount must be a positive number');
      }
      // Reasonable upper limits based on unit
      if (data.wetDailyAmountUnit === 'grams' && dailyAmount > 2000) {
        throw new BadRequestError('Daily amount seems unreasonably large (max 2000 grams)');
      }
      if (data.wetDailyAmountUnit === 'oz' && dailyAmount > 70) { // ~2000g
        throw new BadRequestError('Daily amount seems unreasonably large (max 70 oz)');
      }
    }

    // Validate common fields
    this.validateCommonInputs(data);
  }

  private static validateUUID(id: string, fieldName: string = 'ID'): void {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestError(`Invalid ${fieldName} format`);
    }
  }

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

  // DRY FOOD METHODS //
  // Create DRY food entry
  static async createDryFoodEntry(petId: string, userId: string, data: DryFoodFormData): Promise<DryFoodEntry> {
    try {
      // Input validation 
      this.validateDryFoodInputs(data, false);
      
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

      // Process each entry to update isActive
      const processedEntries = await Promise.all(
        result.map(async (entry) => {
          const entryWithCalculations = entry as DryFoodEntry;
          return await this.updateFoodActiveStatus(entryWithCalculations) as DryFoodEntry;
        })
      )
      return processedEntries;
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
      this.validateUUID(foodId, 'food entry ID');
      
      if (Object.keys(data).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      this.validateDryFoodInputs(data, true);
      
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

      return updatedEntry as DryFoodEntry;
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
      this.validateUUID(foodId, 'food entry ID')
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

      return entry as DryFoodEntry;
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
      this.validateWetFoodInputs(data, false);
      
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

      // Process each entry to update isActive status and add calculations
      const processedEntries = await Promise.all(
        result.map(async (entry) => {
          const entryWithCalculations = entry as WetFoodEntry;
          return await this.updateFoodActiveStatus(entryWithCalculations) as WetFoodEntry;
        })
      );
      return processedEntries;
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
      this.validateUUID(foodId, 'food entry ID');
      
      if (Object.keys(data).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      this.validateWetFoodInputs(data, true);
      
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

      return updatedEntry as WetFoodEntry;
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
      this.validateUUID(foodId, 'food entry ID')
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

      return entry as WetFoodEntry;
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
  
      // Process each entry to update isActive status
      const processedEntries = await Promise.all(
        result.map(async (entry) => {
          const entryWithCalculations = entry as AnyFoodEntry;
          return await this.updateFoodActiveStatus(entryWithCalculations) as AnyFoodEntry;
        })
      );
  
      return processedEntries;
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
      this.validateUUID(foodId, 'food entry ID');
      
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

  private static async updateFoodActiveStatus(entry: DryFoodEntry | WetFoodEntry): Promise<DryFoodEntry | WetFoodEntry> {
    let calculations;
    
    if (entry.foodType === 'dry') {
      calculations = this.calculateDryFoodRemaining(entry as DryFoodEntry);
    } else {
      calculations = this.calculateWetFoodRemaining(entry as WetFoodEntry);
    }
  
    // Simple status update - no cleanup logic
    if (calculations.remainingDays <= 0 && entry.isActive) {
      const [updatedEntry] = await db
        .update(foodEntries)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(foodEntries.id, entry.id))
        .returning();
      
      return { 
        ...updatedEntry, 
        ...calculations 
      } as DryFoodEntry | WetFoodEntry;
    }
    
    return { ...entry, ...calculations };
  }

  // CALCULATION METHODS
  static calculateDryFoodRemaining(entry: DryFoodEntry): { remainingDays: number; depletionDate: Date; remainingWeight: number } {
    const today = new Date();
    const purchaseDate = new Date(entry.datePurchased);
    
    const daysSincePurchase = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Convert bag weight to grams for calculation
    let bagWeightInGrams = parseFloat(entry.bagWeight);
    if (entry.bagWeightUnit === 'kg') {
      bagWeightInGrams = bagWeightInGrams * 1000;
    } else if (entry.bagWeightUnit === 'pounds') {
      bagWeightInGrams = bagWeightInGrams * 453.592;
    }
    
    // Convert daily amount to grams for calculation
    let dailyAmountInGrams = parseFloat(entry.dailyAmount);
    if (entry.dryDailyAmountUnit === 'cups') {
      dailyAmountInGrams = dailyAmountInGrams * 120; // 1 cup ≈ 120g
    }
    
    const foodConsumedInGrams = Math.max(0, daysSincePurchase * dailyAmountInGrams);
    const remainingWeightInGrams = Math.max(0, bagWeightInGrams - foodConsumedInGrams);
    
    // Convert back to original bag weight unit for display
    let remainingWeight = remainingWeightInGrams;
    if (entry.bagWeightUnit === 'kg') {
      remainingWeight = remainingWeightInGrams / 1000;
    } else if (entry.bagWeightUnit === 'pounds') {
      remainingWeight = remainingWeightInGrams / 453.592;
    }
    
    const remainingDays = dailyAmountInGrams > 0 ? Math.floor(remainingWeightInGrams / dailyAmountInGrams) : 0;
    
    // Calculate depletion date for both active and finished items
    let depletionDate: Date;
    if (remainingDays > 0) {
      // Active item: today + remaining days
      depletionDate = new Date();
      depletionDate.setDate(depletionDate.getDate() + remainingDays);
    } else {
      // Finished item: purchase date + total consumption days
      const totalConsumptionDays = dailyAmountInGrams > 0 ? Math.ceil(bagWeightInGrams / dailyAmountInGrams) : 0;
      depletionDate = new Date(purchaseDate);
      depletionDate.setDate(depletionDate.getDate() + totalConsumptionDays);
    }
    
    return { remainingDays, depletionDate, remainingWeight };
  }

  static calculateWetFoodRemaining(entry: WetFoodEntry): { remainingDays: number; depletionDate: Date; remainingWeight: number } {
    const today = new Date();
    const purchaseDate = new Date(entry.datePurchased);
    
    const daysSincePurchase = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Convert total weight to grams for calculation
    let totalWeightInGrams = entry.numberOfUnits * parseFloat(entry.weightPerUnit);
    if (entry.wetWeightUnit === 'oz') {
      totalWeightInGrams = totalWeightInGrams * 28.3495; // oz to grams
    }
    
    // Convert daily amount to grams for calculation
    let dailyAmountInGrams = parseFloat(entry.dailyAmount);

    if (entry.wetDailyAmountUnit === 'oz') {
      dailyAmountInGrams = dailyAmountInGrams * 28.3495; // oz to grams
    }
    
    const foodConsumedInGrams = Math.max(0, daysSincePurchase * dailyAmountInGrams);
    const remainingWeightInGrams = Math.max(0, totalWeightInGrams - foodConsumedInGrams);
    
    // Convert back to original weight unit for display
    let remainingWeight = remainingWeightInGrams;
    if (entry.wetWeightUnit === 'oz') {
      remainingWeight = remainingWeightInGrams / 28.3495; // grams to oz
    }
    
    const remainingDays = dailyAmountInGrams > 0 ? Math.floor(remainingWeightInGrams / dailyAmountInGrams) : 0;
    
    // Calculate depletion date correctly for both active and finished items
    let depletionDate: Date;
    if (remainingDays > 0) {
      // Active item: today + remaining days
      depletionDate = new Date();
      depletionDate.setDate(depletionDate.getDate() + remainingDays);
    } else {
      // Finished item: purchase date + total consumption days
      const totalConsumptionDays = dailyAmountInGrams > 0 ? Math.ceil(totalWeightInGrams / dailyAmountInGrams) : 0;
      depletionDate = new Date(purchaseDate);
      depletionDate.setDate(depletionDate.getDate() + totalConsumptionDays);
    }
    
    return { remainingDays, depletionDate, remainingWeight };
  }
}