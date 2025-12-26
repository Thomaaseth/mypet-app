import { db } from '../db';
import { veterinarians, petVeterinarians } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { Veterinarian, NewVeterinarian } from '../db/schema/veterinarians';
import type { PetVeterinarian } from '../db/schema/pet-veterinarians';
import { 
  BadRequestError, 
  NotFoundError 
} from '../middleware/errors';
import { dbLogger } from '../lib/logger';
import { PetsService } from './pets.service';

export class VeterinariansService {
  // UUID validation helper
  private static validateUUID(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new BadRequestError(`Invalid ${fieldName} format`);
    }
  }

  // Input validation helper
  private static validateVeterinarianInputs(data: Partial<NewVeterinarian>, isUpdate: boolean): void {
    // Required fields for creation
    if (!isUpdate) {
      if (!data.vetName || typeof data.vetName !== 'string' || data.vetName.trim().length === 0) {
        throw new BadRequestError('Veterinarian name is required');
      }
      if (!data.phone || typeof data.phone !== 'string' || data.phone.trim().length === 0) {
        throw new BadRequestError('Phone number is required');
      }
      if (!data.addressLine1 || typeof data.addressLine1 !== 'string' || data.addressLine1.trim().length === 0) {
        throw new BadRequestError('Address is required');
      }
      if (!data.city || typeof data.city !== 'string' || data.city.trim().length === 0) {
        throw new BadRequestError('City is required');
      }
      if (!data.zipCode || typeof data.zipCode !== 'string' || data.zipCode.trim().length === 0) {
        throw new BadRequestError('ZIP code is required');
      }
    }

    // Optional fields validation (for both create and update)
    if (data.vetName !== undefined) {
      if (typeof data.vetName !== 'string' || data.vetName.length > 100) {
        throw new BadRequestError('Veterinarian name must be less than 100 characters');
      }
    }

    if (data.clinicName !== undefined && data.clinicName !== null && data.clinicName !== '') {
      if (typeof data.clinicName !== 'string' || data.clinicName.length > 100) {
        throw new BadRequestError('Clinic name must be less than 100 characters');
      }
    }

    if (data.phone !== undefined) {
      if (typeof data.phone !== 'string' || data.phone.length > 20) {
        throw new BadRequestError('Phone number must be less than 20 characters');
      }
    }

    if (data.email !== undefined && data.email !== null && data.email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof data.email !== 'string' || !emailRegex.test(data.email) || data.email.length > 100) {
        throw new BadRequestError('Invalid email format or too long (max 100 characters)');
      }
    }

    if (data.website !== undefined && data.website !== null && data.website !== '') {
      const websiteRegex = /^(https?:\/\/)?(www\.)?[\w\-]+(\.[\w\-]+)+/;
      if (typeof data.website !== 'string' || data.website.length < 4 || data.website.length > 100 || !websiteRegex.test(data.website)) {
        throw new BadRequestError('Please enter a valid website (e.g., www.example.com or example.com, max 100 characters)');
      }
    }

    if (data.notes !== undefined && data.notes !== null && data.notes !== '') {
      if (typeof data.notes !== 'string' || data.notes.length > 100) {
        throw new BadRequestError('Notes must be less than 100 characters');
      }
    }
  }

  // Get all active veterinarians for a user
  static async getUserVeterinarians(userId: string): Promise<Veterinarian[]> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid user ID is required');
      }

      const vets = await db
        .select()
        .from(veterinarians)
        .where(and(
          eq(veterinarians.userId, userId),
          eq(veterinarians.isActive, true)
        ))
        .orderBy(veterinarians.createdAt);

      return vets;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching veterinarians');
      throw new BadRequestError('Failed to fetch veterinarians');
    }
  }

  // Get a single veterinarian by ID
  static async getVeterinarianById(vetId: string, userId: string): Promise<Veterinarian> {
    try {
      this.validateUUID(vetId, 'veterinarian ID');
      
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid user ID is required');
      }

      const [vet] = await db
        .select()
        .from(veterinarians)
        .where(and(
          eq(veterinarians.id, vetId),
          eq(veterinarians.userId, userId),
          eq(veterinarians.isActive, true)
        ));

      if (!vet) {
        throw new NotFoundError('Veterinarian not found');
      }

      return vet;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching veterinarian');
      throw new BadRequestError('Failed to fetch veterinarian');
    }
  }

  // Create a new veterinarian
  static async createVeterinarian(vetData: NewVeterinarian, petIds?: string[]): Promise<Veterinarian> {
    try {
      // Input validation
      this.validateVeterinarianInputs(vetData, false);

      // Clean and prepare data
      const cleanedData: NewVeterinarian = {
        userId: vetData.userId,
        vetName: vetData.vetName,
        clinicName: vetData.clinicName || null,
        phone: vetData.phone,
        email: vetData.email || null,
        website: vetData.website || null,
        addressLine1: vetData.addressLine1,
        addressLine2: vetData.addressLine2 || null,
        city: vetData.city,
        zipCode: vetData.zipCode,
        notes: vetData.notes || null,
        isActive: true,
      };

      // Execute db write
      const [newVet] = await db
        .insert(veterinarians)
        .values(cleanedData)
        .returning();

      // If petIds provided, assign vet to those pets
      if (petIds && petIds.length > 0) {
        await this.assignVetToPets(newVet.id, vetData.userId, petIds);
      }

      dbLogger.info({ vetId: newVet.id }, 'Veterinarian created successfully');
      return newVet;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error creating veterinarian');
      throw new BadRequestError('Failed to create veterinarian');
    }
  }

  // Update a veterinarian
  static async updateVeterinarian(
    vetId: string, 
    userId: string, 
    updateData: Partial<NewVeterinarian>
  ): Promise<Veterinarian> {
    try {
      // Input validation
      this.validateUUID(vetId, 'veterinarian ID');
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('Valid user ID is required');
      }
      
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }
      
      this.validateVeterinarianInputs(updateData, true);
      
      // Authorization check
      await this.getVeterinarianById(vetId, userId);

      // Clean the update data
      const cleanedData: Partial<NewVeterinarian> = {
        ...updateData,
        clinicName: updateData.clinicName === '' ? null : updateData.clinicName,
        email: updateData.email === '' ? null : updateData.email,
        website: updateData.website === '' ? null : updateData.website,
        addressLine2: updateData.addressLine2 === '' ? null : updateData.addressLine2,
        notes: updateData.notes === '' ? null : updateData.notes,
      };

      // Execute update
      const [updatedVet] = await db
        .update(veterinarians)
        .set({
          ...cleanedData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(veterinarians.id, vetId),
          eq(veterinarians.userId, userId)
        ))
        .returning();

      if (!updatedVet) {
        throw new NotFoundError('Veterinarian not found');
      }

      dbLogger.info({ vetId }, 'Veterinarian updated successfully');
      return updatedVet;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error updating veterinarian');
      throw new BadRequestError('Failed to update veterinarian');
    }
  }

  // Soft delete a veterinarian
  static async deleteVeterinarian(vetId: string, userId: string): Promise<void> {
    try {
      // Input validation 
      await this.getVeterinarianById(vetId, userId);

      // Execute soft delete
      const [updatedVet] = await db
        .update(veterinarians)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(
          eq(veterinarians.id, vetId),
          eq(veterinarians.userId, userId)
        ))
        .returning();

      if (!updatedVet) {
        throw new NotFoundError('Veterinarian not found');
      }

      // Unassign from all pets
      await db
        .delete(petVeterinarians)
        .where(eq(petVeterinarians.veterinarianId, vetId));

      dbLogger.info({ vetId }, 'Veterinarian soft deleted and unassigned from all pets');
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error deleting veterinarian');
      throw new BadRequestError('Failed to delete veterinarian');
    }
  }

  // Assign veterinarian to pets
  static async assignVetToPets(
    vetId: string, 
    userId: string, 
    petIds: string[]
  ): Promise<void> {
    try {
      // Validate vet exists and belongs to user
      await this.getVeterinarianById(vetId, userId);

      // Validate all pets belong to user
      for (const petId of petIds) {
        await PetsService.getPetById(petId, userId);
      }

      // Create assignments (using ON CONFLICT to handle duplicates)
      const assignmentsToInsert = petIds.map(petId => ({
        petId,
        veterinarianId: vetId,
      }));

      // Delete existing assignments first to avoid conflicts
      await db
        .delete(petVeterinarians)
        .where(and(
          eq(petVeterinarians.veterinarianId, vetId),
          inArray(petVeterinarians.petId, petIds)
        ));

      // Insert new assignments
      await db
        .insert(petVeterinarians)
        .values(assignmentsToInsert);

      dbLogger.info({ vetId, petIds }, 'Veterinarian assigned to pets');
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error assigning veterinarian to pets');
      throw new BadRequestError('Failed to assign veterinarian to pets');
    }
  }

  // Unassign veterinarian from pets
  static async unassignVetFromPets(vetId: string, userId: string, petIds: string[]): Promise<void> {
    try {
      // Validate vet exists and belongs to user
      await this.getVeterinarianById(vetId, userId);

      // Delete assignments
      await db
        .delete(petVeterinarians)
        .where(and(
          eq(petVeterinarians.veterinarianId, vetId),
          inArray(petVeterinarians.petId, petIds)
        ));

      dbLogger.info({ vetId, petIds }, 'Veterinarian unassigned from pets');
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error unassigning veterinarian from pets');
      throw new BadRequestError('Failed to unassign veterinarian from pets');
    }
  }

  // Get pets assigned to a veterinarian
  static async getVetPets(vetId: string, userId: string): Promise<Array<{ petId: string}>> {
    try {
      // Validate vet exists and belongs to user
      await this.getVeterinarianById(vetId, userId);

      const assignments = await db
        .select({
          petId: petVeterinarians.petId,
        })
        .from(petVeterinarians)
        .where(eq(petVeterinarians.veterinarianId, vetId));

      return assignments;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching vet pets');
      throw new BadRequestError('Failed to fetch vet pets');
    }
  }

  // Get vets assigned to a pet
  static async getVetsForPet(petId: string, userId: string): Promise<Veterinarian[]> {
    try {
      // Get all vet-pet assignments for this pet
      const assignments = await db
        .select({
          veterinarianId: petVeterinarians.veterinarianId,
        })
        .from(petVeterinarians)
        .where(eq(petVeterinarians.petId, petId));

      if (assignments.length === 0) {
        return [];
      }

      const vetIds = assignments.map(a => a.veterinarianId);

      // Get all vets that are assigned to this pet AND belong to this user
      const vets = await db
        .select()
        .from(veterinarians)
        .where(
          and(
            eq(veterinarians.userId, userId),
            inArray(veterinarians.id, vetIds)
          )
        );

      return vets;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching vets for pet');
      throw new BadRequestError('Failed to fetch vets for pet');
    }
  }

  // Get veterinarians for a specific pet
  static async getPetVeterinarians(petId: string, userId: string): Promise<Array<Veterinarian>> {
    try {
      // Validate pet exists and belongs to user
      await PetsService.getPetById(petId, userId);

      const vets = await db
        .select({
          id: veterinarians.id,
          userId: veterinarians.userId,
          vetName: veterinarians.vetName,
          clinicName: veterinarians.clinicName,
          phone: veterinarians.phone,
          email: veterinarians.email,
          website: veterinarians.website,
          addressLine1: veterinarians.addressLine1,
          addressLine2: veterinarians.addressLine2,
          city: veterinarians.city,
          zipCode: veterinarians.zipCode,
          notes: veterinarians.notes,
          isActive: veterinarians.isActive,
          createdAt: veterinarians.createdAt,
          updatedAt: veterinarians.updatedAt,
        })
        .from(veterinarians)
        .innerJoin(
          petVeterinarians,
          eq(petVeterinarians.veterinarianId, veterinarians.id)
        )
        .where(and(
          eq(petVeterinarians.petId, petId),
          eq(veterinarians.isActive, true)
        ));

      return vets;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching pet veterinarians');
      throw new BadRequestError('Failed to fetch pet veterinarians');
    }
  }
}