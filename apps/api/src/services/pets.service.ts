import { db } from '../db';
import { pets } from '../db/schema/pets';
import { eq, and, desc } from 'drizzle-orm';
import type { Pet, NewPet, PetGender } from '../db/schema/pets';
import { weightEntries } from '../db/schema/weight-entries';
import { 
  BadRequestError, 
  NotFoundError 
} from '../middleware/errors';
import { dbLogger } from '@/lib/logger';
import { validateUUID } from '@/lib/validateUUID';
import type { WeightUnit } from '@/shared/validations/pet';
import { convertWeight } from '@/shared/utils/units';
import { UserPreferencesService } from './user-preferences.service';

export class PetsService {
  // input validation helpers
  private static validatePetInputs(petData: Partial<NewPet>, today: string, isUpdate = false): void {
    // userId is auth-derived (never in the request body/schema), so it's guarded
    // here. Everything else (name/animalType/gender/lengths/microchip format)
    // is enforced by the strict shared schema at the route
    // (validateCreatePet / validateUpdatePet) and is not duplicated.
    if (!isUpdate && !petData.userId) {
      throw new BadRequestError('User ID is required');
    }

    // Birth-date business rules the shared schema can't express: they depend on
    // the user's timezone-aware "today". (Date *format* is validated by the schema.)
    if (petData.birthDate) {
      if (petData.birthDate > today) {
        throw new BadRequestError('Birth date cannot be in the future');
      }
      const thirtyYearsAgo = new Date();
      thirtyYearsAgo.setUTCFullYear(thirtyYearsAgo.getUTCFullYear() - 30);
      const thirtyYearsAgoString = thirtyYearsAgo.toISOString().split('T')[0];
      if (petData.birthDate < thirtyYearsAgoString) {
        throw new BadRequestError('Birth date cannot be more than 30 years ago');
      }
    }
  }

  // Weight validation with business logic
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
  
    if (weightInKg > 200) {
      throw new BadRequestError(`Weight exceeds maximum allowed (200kg)`);
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
        // Fav first (boolean DESC puts true ahead of false)
        .orderBy(desc(pets.isFavorite), desc(pets.createdAt));

      return result;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching user pets');
      throw new BadRequestError('Failed to fetch pets');
    }
  }

  // Get a single pet by ID
  static async getPetById(petId: string, userId: string): Promise<Pet> {
    try {
      // Input validation
      validateUUID(petId, 'pet ID');
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
      dbLogger.error({ err: error }, 'Error fetching pet by ID');
      throw new BadRequestError('Failed to fetch pet');
    }
  }

  // Create a new pet 
  static async createPet(petData: NewPet & { weight?: string; weightUnit?: WeightUnit }): Promise<Pet> {
    try {

      // Extract and separate weight fields from pet data
      const { weight, weightUnit } = petData;

      const today = await UserPreferencesService.getTodayForUser(petData.userId);

      // Input validation
      this.validatePetInputs(petData, today, false);
      
      // Validate weight separately if provided
      if (weight && weightUnit) {
        // this.validateWeightFields(weight, weightUnit);
        const weightInKg = convertWeight(parseFloat(weight), weightUnit, 'kg');
        this.validateWeightLimits(weightInKg, petData.animalType);
      }

      // Clean and prepare data
      const cleanedData: NewPet = {
        name: petData.name,
        userId: petData.userId,
        animalType: petData.animalType,
        species: petData.species || null,
        gender: petData.gender,
        birthDate: petData.birthDate || null,
        isNeutered: petData.isNeutered,
        microchipNumber: petData.microchipNumber || null, 
        imageUrl: petData.imageUrl,
        notes: petData.notes || null,
        isActive: petData.isActive,
      };

      // Execute db write
      const [newPet] = await db
        .insert(pets)
        .values(cleanedData)
        .returning();


      // If weight is provided, create initial weight entry
      if (weight && weightUnit && newPet.createdAt) {
        try {      
          const weightInKg = convertWeight(parseFloat(weight), weightUnit, 'kg'); 
          
          await db.insert(weightEntries).values({
            petId: newPet.id,
            weight: weightInKg.toFixed(3),
            date: today,
          });
          
          dbLogger.info({ petId: newPet.id }, 'Initial weight entry created');
        } catch (weightError) {
          dbLogger.error({ err: weightError }, 'Failed to create initial weight entry');
        }
      }

      return newPet;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error creating pet');
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
      validateUUID(petId, 'pet ID');
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid user ID is required');
      }
      
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }

      const today = await UserPreferencesService.getTodayForUser(userId);

      this.validatePetInputs(updateData, today, true);
      
      // Authorization check
      const existingPet = await this.getPetById(petId, userId);

      // Clean the update data
      const cleanedData: Partial<NewPet> = {
        ...updateData,
        species: updateData.species === '' ? null : updateData.species,
        birthDate: updateData.birthDate === '' ? null : updateData.birthDate,
        microchipNumber: updateData.microchipNumber === '' ? null : updateData.microchipNumber,
        notes: updateData.notes === '' ? null : updateData.notes,
        imageUrl: updateData.imageUrl === '' ? null : updateData.imageUrl,
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
      dbLogger.error({ err: error }, 'Error updating pet');
      throw new BadRequestError('Failed to update pet');
    }
  }

  // Set or clear the single favourite pet for a user
  static async setPetFavorite(
    petId: string,
    userId: string,
    isFavorite: boolean
  ): Promise<Pet> {
    try {
      // Authorization + existence (validates UUID, enforces ownership + isActive)
      await this.getPetById(petId, userId);

      const updated = await db.transaction(async (tx) => {
        if (isFavorite) {
          // Enforce single favourite: clear the user's current favourite first.
          // Scoped by userId only (not isActive) so a lingering favourite on a
          // soft-deleted pet can't trip the partial unique index.
          await tx
            .update(pets)
            .set({ isFavorite: false, updatedAt: new Date() })
            .where(and(
              eq(pets.userId, userId),
              eq(pets.isFavorite, true)
            ));
        }

        const [row] = await tx
          .update(pets)
          .set({ isFavorite, updatedAt: new Date() })
          .where(and(
            eq(pets.id, petId),
            eq(pets.userId, userId)
          ))
          .returning();

        return row;
      });

      if (!updated) {
        throw new NotFoundError('Pet not found');
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error setting pet favorite');
      throw new BadRequestError('Failed to update favorite');
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
      dbLogger.error({ err: error }, 'Error deleting pet');
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
      dbLogger.error({ err: error }, 'Error hard deleting pet');
      throw new BadRequestError('Failed to permanently delete pet');
    }
  }
}