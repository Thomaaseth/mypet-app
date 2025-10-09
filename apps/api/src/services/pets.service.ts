import { db } from '../db';
import { pets } from '../db/schema/pets';
import { eq, and, desc } from 'drizzle-orm';
import type { Pet, NewPet, PetGender, WeightUnit } from '../db/schema/pets';
import { weightEntries } from '../db/schema/weight-entries';
import { 
  BadRequestError, 
  NotFoundError, 
  UserForbiddenError 
} from '../middleware/errors';

export class PetsService {
  // input validation helpers
  private static validatePetInputs(petData: Partial<NewPet>, isUpdate = false): void {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!petData.name || !petData.userId || !petData.animalType) {
        throw new BadRequestError('Pet name, user ID, and animal type are required');
      }
    }

    // Name validation
    if (petData.name !== undefined) {
      if (typeof petData.name !== 'string' || petData.name.trim().length === 0) {
        throw new BadRequestError('Pet name must be a non-empty string');
      }
      if (petData.name.length > 100) {
        throw new BadRequestError('Pet name must be 100 characters or less');
      }
    }

    // Animal type validation
    if (petData.animalType !== undefined) {
      const validAnimalTypes = ['cat', 'dog'];
      if (!validAnimalTypes.includes(petData.animalType)) {
        throw new BadRequestError('Animal type must be either cat or dog');
      }
    }

    // Gender validation
    if (petData.gender !== undefined && petData.gender !== null) {
      const validGenders: PetGender[] = ['male', 'female', 'unknown'];
      if (!validGenders.includes(petData.gender)) {
        throw new BadRequestError('Gender must be male, female, or unknown');
      }
    }

    // Weight unit validation
    if (petData.weightUnit !== undefined && petData.weightUnit !== null) {
      const validWeightUnits: WeightUnit[] = ['kg', 'lbs'];
      if (!validWeightUnits.includes(petData.weightUnit)) {
        throw new BadRequestError('Weight unit must be kg or lbs');
      }
    }

    // Birth date validation
    if (petData.birthDate !== undefined && petData.birthDate !== null && petData.birthDate !== '') {
      const birthDate = new Date(petData.birthDate);
      if (isNaN(birthDate.getTime())) {
        throw new BadRequestError('Invalid birth date format');
      }

      // Birth date cannot be in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (birthDate > today) {
        throw new BadRequestError('Birth date cannot be in the future');
      }

      // Reasonable age limits (pets can't be older than 50 years)
      const fiftyYearsAgo = new Date();
      fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
      if (birthDate < fiftyYearsAgo) {
        throw new BadRequestError('Birth date cannot be more than 50 years ago');
      }
    }

    // Weight validation
    if (petData.weight !== undefined && petData.weight !== null && petData.weight !== '') {
      const weightValue = parseFloat(petData.weight.toString());
      if (isNaN(weightValue) || weightValue <= 0) {
        throw new BadRequestError('Weight must be a positive number');
      }
    }

    // String field length validations
    if (petData.species && petData.species.length > 50) {
      throw new BadRequestError('Species must be 50 characters or less');
    }
    if (petData.microchipNumber && petData.microchipNumber.length > 20) {
      throw new BadRequestError('Microchip number must be 20 characters or less');
    }
    if (petData.notes && petData.notes.length > 1000) {
      throw new BadRequestError('Notes must be 1000 characters or less');
    }

    // Microchip number format validation (if provided)
    // if (petData.microchipNumber && petData.microchipNumber.trim().length > 0) {
    //   // Basic alphanumeric validation (microchips are usually 10-15 alphanumeric chars)
    //   if (!/^[a-zA-Z0-9]{8,20}$/.test(petData.microchipNumber.trim())) {
    //     throw new BadRequestError('Microchip number must be 8-20 alphanumeric characters');
    //   }
    // }
  }

  // Weight validation with business logic
  private static validateWeightLimits(weight: number, animalType: string, weightUnit: string = 'kg'): void {
    // Convert weight to kg for consistent validation
    let weightInKg = weight;
    if (weightUnit === 'lbs') {
      weightInKg = weight / 2.20462; // Convert lbs to kg
    }

    // Weight ranges per animal type (in kg)
    const weightLimits = {
      cat: { min: 0.05, max: 15 }, // 0.05-15kg
      dog: { min: 0.5, max: 90 }, // 0.5-90kg
    };

    // Get limits for this animal type
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

    // Absolute maximum of 200kg regardless of animal type
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

  // Get all pets for a user
  static async getUserPets(userId: string): Promise<Pet[]> {
    try {
      // Basic user ID validation
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid user ID is required');
      }

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
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error fetching user pets:', error);
      throw new BadRequestError('Failed to fetch pets');
    }
  }

  // Get a single pet by ID
  static async getPetById(petId: string, userId: string): Promise<Pet> {
    try {
      // Input validation
      this.validateUUID(petId, 'pet ID');
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid user ID is required');
      }

      // Database operation
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
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error fetching pet by ID:', error);
      throw new BadRequestError('Failed to fetch pet');
    }
  }

  // Create a new pet 
  static async createPet(petData: NewPet): Promise<Pet> {
    try {
      // Input validation
      this.validatePetInputs(petData, false);
      
      // Business logic validation (weight limits)
      if (petData.weight) {
        const weightValue = parseFloat(petData.weight);
        this.validateWeightLimits(weightValue, petData.animalType, petData.weightUnit || 'kg');
      }

      // Clean and prepare data
      const cleanedData: NewPet = {
        ...petData,
        species: petData.species || null,
        birthDate: petData.birthDate || null,
        weight: petData.weight || null,
        microchipNumber: petData.microchipNumber || null,
        notes: petData.notes || null,
      };

      // Execute db write
      const [newPet] = await db
        .insert(pets)
        .values(cleanedData)
        .returning();


      // If weight is provided, create initial weight entry
      if (newPet.weight && newPet.createdAt) {
        try {       
          // Format the date as YYYY-MM-DD using the pet's createdAt timestamp
          const entryDate = new Date(newPet.createdAt).toISOString().split('T')[0];
          
          await db.insert(weightEntries).values({
            petId: newPet.id,
            weight: newPet.weight,
            date: entryDate,
          });
          
          console.log(`Initial weight entry created for pet ${newPet.id}`);
        } catch (weightError) {
          // if error, don't don't fail pet creation
          console.error('Failed to create initial weight entry:', weightError);
        }
      }

      return newPet;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('Error creating pet:', error);
      throw new BadRequestError('Failed to create pet');
    }
  }

  // Update a pet 
  static async updatePet(
    petId: string, 
    userId: string, 
    updateData: Partial<NewPet>
  ): Promise<Pet> {
    try {
      // Input validation
      this.validateUUID(petId, 'pet ID');
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid user ID is required');
      }
      
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      this.validatePetInputs(updateData, true);
      
      // Authorization check
      const existingPet = await this.getPetById(petId, userId);

      // Business logic validation (weight limits)
      if (updateData.weight !== undefined && updateData.weight !== null && updateData.weight !== '') {
        const weightValue = parseFloat(updateData.weight.toString());
        
        // Use the animal type from update or existing pet
        const animalType = updateData.animalType || existingPet.animalType;
        const weightUnit = updateData.weightUnit || existingPet.weightUnit || 'kg';
        
        this.validateWeightLimits(weightValue, animalType, weightUnit);
      }

      // Clean the update data
      const cleanedData: Partial<NewPet> = {
        ...updateData,
        species: updateData.species === '' ? null : updateData.species,
        birthDate: updateData.birthDate === '' ? null : updateData.birthDate,
        weight: updateData.weight === '' ? null : updateData.weight,
        microchipNumber: updateData.microchipNumber === '' ? null : updateData.microchipNumber,
        notes: updateData.notes === '' ? null : updateData.notes,
      };

      // Execute update
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

  // Soft delete a pet
  static async deletePet(petId: string, userId: string): Promise<void> {
    try {
      // Input validation 
      const existingPet = await this.getPetById(petId, userId);

      // Execute soft delete
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

  // Hard delete a pet 
  static async hardDeletePet(petId: string, userId: string): Promise<void> {
    try {
      // Input validation
      const existingPet = await this.getPetById(petId, userId);

      // Execute hard delete
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
      // Basic user ID validation
      if (!userId || typeof userId !== 'string') {
        return 0;
      }

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