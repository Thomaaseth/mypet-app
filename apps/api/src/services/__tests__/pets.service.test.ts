import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import type { NewPet } from '../../db/schema/pets';
import { BadRequestError, NotFoundError } from '../../middleware/errors';
import { PetsService } from '../pets.service';
import { db } from '../../db';
import { DatabaseTestUtils } from '../../test/database-test-utils';

describe('PetsService', () => {
  describe('getUserPets', () => {
    it('should return all active pets for a user', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      await db.insert(schema.pets).values([
        {
          userId: primary.id,
          name: 'Fluffy',
          animalType: 'cat',
          species: 'Persian',
          isActive: true,
        },
        {
          userId: primary.id,
          name: 'Buddy',
          animalType: 'dog',
          species: 'Golden Retriever',
          isActive: true,
        },
      ]);

      const result = await PetsService.getUserPets(primary.id);

      expect(result).toHaveLength(2);
      expect(result.every(pet => pet.userId === primary.id)).toBe(true);
      expect(result.every(pet => pet.isActive)).toBe(true);
      
      const names = result.map(pet => pet.name);
      expect(names).toContain('Fluffy');
      expect(names).toContain('Buddy');
    });

    it('should return pets in newest-first order', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const [firstPet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'First Pet',
        animalType: 'cat',
      }).returning();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const [secondPet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Second Pet',
        animalType: 'dog',
      }).returning();

      const result = await PetsService.getUserPets(primary.id);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Second Pet');
      expect(result[1].name).toBe('First Pet');
    });

    it('should not return inactive pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      await db.insert(schema.pets).values([
        {
          userId: primary.id,
          name: 'Active Pet',
          animalType: 'cat',
          isActive: true,
        },
        {
          userId: primary.id,
          name: 'Inactive Pet',
          animalType: 'dog',
          isActive: false,
        },
      ]);

      const result = await PetsService.getUserPets(primary.id);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active Pet');
    });

    it('should return empty array when user has no pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      const result = await PetsService.getUserPets(primary.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return pets for the specified user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();

      await db.insert(schema.pets).values([
        {
          userId: primary.id,
          name: 'My Pet',
          animalType: 'cat',
        },
        {
          userId: secondary.id,
          name: 'Other Pet',
          animalType: 'dog',
        },
      ]);

      const result = await PetsService.getUserPets(primary.id);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Pet');
      expect(result[0].userId).toBe(primary.id);
    });

    it('should handle empty userId gracefully', async () => {
      const result = await PetsService.getUserPets('');

      expect(result).toEqual([]);
    });
  });

  describe('getPetById', () => {
    it('should return pet when found and belongs to user', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [insertedPet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Fluffy',
        animalType: 'cat',
        species: 'Persian',
      }).returning();

      const result = await PetsService.getPetById(insertedPet.id, primary.id);

      expect(result.id).toBe(insertedPet.id);
      expect(result.name).toBe('Fluffy');
      expect(result.userId).toBe(primary.id);
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();
      
      await expect(
        PetsService.getPetById(nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();

      const [insertedPet] = await db.insert(schema.pets).values({
        userId: secondary.id,
        name: 'Other User Pet',
        animalType: 'cat',
      }).returning();

      await expect(
        PetsService.getPetById(insertedPet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet is inactive', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [insertedPet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Inactive Pet',
        animalType: 'cat',
        isActive: false,
      }).returning();

      await expect(
        PetsService.getPetById(insertedPet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle invalid UUID format', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      await expect(
        PetsService.getPetById('invalid-uuid', primary.id)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('createPet', () => {
    it('should create pet with valid data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newPetData: NewPet = {
        name: 'Fluffy',
        userId: primary.id,
        animalType: 'cat',
        species: 'Persian',
        gender: 'female',
        weightUnit: 'kg',
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.name).toBe('Fluffy');
      expect(result.userId).toBe(primary.id);
      expect(result.animalType).toBe('cat');
      expect(result.species).toBe('Persian');
      expect(result.isActive).toBe(true);
      expect(result.id).toBeDefined();
      
      const savedPets = await db.select().from(schema.pets);
      expect(savedPets).toHaveLength(1);
    });

    it('should create pet with minimal required data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newPetData: NewPet = {
        name: 'Basic Pet',
        userId: primary.id,
        animalType: 'dog',
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.name).toBe('Basic Pet');
      expect(result.userId).toBe(primary.id);
      expect(result.animalType).toBe('dog');
      expect(result.species).toBeNull();
      expect(result.gender).toBe('unknown');
      expect(result.weightUnit).toBe('kg');
    });

    it('should throw BadRequestError when name is missing', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData = {
        userId: primary.id,
        animalType: 'cat',
      } as NewPet;

      await expect(PetsService.createPet(invalidData)).rejects.toThrow(BadRequestError);
      await expect(PetsService.createPet(invalidData)).rejects.toThrow('Pet name and user ID are required');
    });

    it('should throw BadRequestError when userId is missing', async () => {
      const invalidData = {
        name: 'Fluffy',
        animalType: 'cat',
      } as NewPet;

      await expect(PetsService.createPet(invalidData)).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when name is empty string', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const invalidData: NewPet = {
        name: '',
        userId: primary.id,
        animalType: 'cat',
      };

      await expect(PetsService.createPet(invalidData)).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when userId is empty string', async () => {
      const invalidData: NewPet = {
        name: 'Fluffy',
        userId: '',
        animalType: 'cat',
      };

      await expect(PetsService.createPet(invalidData)).rejects.toThrow(BadRequestError);
    });

    it('should convert empty strings to null for optional fields', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newPetData: NewPet = {
        name: 'Fluffy',
        userId: primary.id,
        animalType: 'cat',
        species: '',
        notes: '',
        microchipNumber: '',
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.species).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.microchipNumber).toBeNull();
    });

    it('should handle all optional fields with proper values', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newPetData: NewPet = {
        name: 'Max',
        userId: primary.id,
        animalType: 'dog',
        species: 'Golden Retriever',
        gender: 'male',
        birthDate: '2020-01-15',
        weight: '25.5',
        weightUnit: 'kg',
        isNeutered: true,
        microchipNumber: 'ABC123456789',
        notes: 'Very friendly dog',
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.species).toBe('Golden Retriever');
      expect(result.gender).toBe('male');
      expect(result.birthDate).toBe('2020-01-15');
      expect(result.weight).toBe('25.50');
      expect(result.isNeutered).toBe(true);
      expect(result.microchipNumber).toBe('ABC123456789');
      expect(result.notes).toBe('Very friendly dog');
    });
  });

  describe('updatePet', () => {
    it('should update pet with valid data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Original Name',
        animalType: 'cat',
        species: 'Persian',
      }).returning();

      const updateData = {
        name: 'Updated Name',
        species: 'Maine Coon',
        weight: '4.5',
      };

      const result = await PetsService.updatePet(pet.id, primary.id, updateData);

      expect(result.name).toBe('Updated Name');
      expect(result.species).toBe('Maine Coon');
      expect(result.weight).toBe('4.50');
      expect(result.updatedAt).toBeDefined();
    });

    it('should update only provided fields', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Original Name',
        animalType: 'cat',
        species: 'Persian',
      }).returning();

      const updateData = { name: 'New Name Only' };

      const result = await PetsService.updatePet(pet.id, primary.id, updateData);

      expect(result.name).toBe('New Name Only');
      expect(result.species).toBe('Persian');
    });

    it('should convert empty strings to null', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Test Pet',
        animalType: 'cat',
        species: 'Persian',
      }).returning();

      const updateData = {
        species: '',
        notes: '',
        microchipNumber: '',
      };

      const result = await PetsService.updatePet(pet.id, primary.id, updateData);

      expect(result.species).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.microchipNumber).toBeNull();
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();
      const updateData = { name: 'New Name' };

      await expect(
        PetsService.updatePet(nonExistentId, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: secondary.id,
        name: 'Other User Pet',
        animalType: 'cat',
      }).returning();

      const updateData = { name: 'Hacker Name' };

      await expect(
        PetsService.updatePet(pet.id, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet is inactive', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Test Pet',
        animalType: 'cat',
        isActive: false,
      }).returning();

      const updateData = { name: 'Should Not Work' };

      await expect(
        PetsService.updatePet(pet.id, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle invalid UUID format', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const updateData = { name: 'New Name' };

      await expect(
        PetsService.updatePet('invalid-uuid', primary.id, updateData)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deletePet (soft delete)', () => {
    it('should soft delete pet', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Pet to Delete',
        animalType: 'cat',
      }).returning();

      await PetsService.deletePet(pet.id, primary.id);

      const [deletedPet] = await db.select()
        .from(schema.pets)
        .where(eq(schema.pets.id, pet.id));

      expect(deletedPet.isActive).toBe(false);
      expect(deletedPet.updatedAt).toBeDefined();
    });

    it('should not affect getPetById after soft delete', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Pet to Delete',
        animalType: 'cat',
      }).returning();

      await PetsService.deletePet(pet.id, primary.id);

      await expect(
        PetsService.getPetById(pet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();

      await expect(
        PetsService.deletePet(nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: secondary.id,
        name: 'Other User Pet',
        animalType: 'cat',
      }).returning();

      await expect(
        PetsService.deletePet(pet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('hardDeletePet', () => {
    it('should permanently delete pet', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Pet to Hard Delete',
        animalType: 'dog',
      }).returning();

      await PetsService.hardDeletePet(pet.id, primary.id);

      const deletedPets = await db.select()
        .from(schema.pets)
        .where(eq(schema.pets.id, pet.id));

      expect(deletedPets).toHaveLength(0);
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const nonExistentId = randomUUID();

      await expect(
        PetsService.hardDeletePet(nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: secondary.id,
        name: 'Other User Pet',
        animalType: 'dog',
      }).returning();

      await expect(
        PetsService.hardDeletePet(pet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserPetCount', () => {
    it('should return correct count of active pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      await db.insert(schema.pets).values([
        { userId: primary.id, name: 'Pet 1', animalType: 'cat', isActive: true },
        { userId: primary.id, name: 'Pet 2', animalType: 'dog', isActive: true },
        { userId: primary.id, name: 'Pet 3', animalType: 'cat', isActive: false },
      ]);

      const result = await PetsService.getUserPetCount(primary.id);

      expect(result).toBe(2);
    });

    it('should return 0 when user has no pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();

      const result = await PetsService.getUserPetCount(primary.id);

      expect(result).toBe(0);
    });

    it('should return 0 when user has only inactive pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      await db.insert(schema.pets).values([
        { userId: primary.id, name: 'Inactive Pet 1', animalType: 'cat', isActive: false },
        { userId: primary.id, name: 'Inactive Pet 2', animalType: 'dog', isActive: false },
      ]);

      const result = await PetsService.getUserPetCount(primary.id);

      expect(result).toBe(0);
    });

    it('should not count other users pets', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();

      await db.insert(schema.pets).values([
        { userId: primary.id, name: 'My Pet', animalType: 'cat', isActive: true },
        { userId: secondary.id, name: 'Other Pet 1', animalType: 'dog', isActive: true },
        { userId: secondary.id, name: 'Other Pet 2', animalType: 'cat', isActive: true },
      ]);

      const result = await PetsService.getUserPetCount(primary.id);

      expect(result).toBe(1);
    });

    it('should handle invalid userId gracefully', async () => {
      const result = await PetsService.getUserPetCount('non-existent-user');

      expect(result).toBe(0);
    });

    it('should handle empty userId gracefully', async () => {
      const result = await PetsService.getUserPetCount('');

      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const result = await PetsService.getUserPetCount(null as any);
      expect(result).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent operations on the same pet', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [pet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Concurrent Pet',
        animalType: 'cat',
      }).returning();

      const updatePromises = [
        PetsService.updatePet(pet.id, primary.id, { name: 'Updated Name 1' }),
        PetsService.updatePet(pet.id, primary.id, { species: 'Persian' }),
        PetsService.updatePet(pet.id, primary.id, { weight: '5.0' }),
      ];

      const results = await Promise.all(updatePromises);

      results.forEach(result => {
        expect(result.id).toBe(pet.id);
      });
    });

    it('should handle very long names and strings', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const longName = 'A'.repeat(100);
      const longSpecies = 'B'.repeat(50);
      const longNotes = 'C'.repeat(1000);

      const newPetData: NewPet = {
        name: longName,
        userId: primary.id,
        animalType: 'cat',
        species: longSpecies,
        notes: longNotes,
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.name).toBe(longName);
      expect(result.species).toBe(longSpecies);
      expect(result.notes).toBe(longNotes);
    });

    it('should preserve data types correctly', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newPetData: NewPet = {
        name: 'Type Test Pet',
        userId: primary.id,
        animalType: 'dog',
        weight: '25.75',
        isNeutered: true,
        birthDate: '2020-12-25',
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.weight).toBe('25.75');
      expect(result.isNeutered).toBe(true);
      expect(result.birthDate).toBe('2020-12-25');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle special characters in text fields', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const newPetData: NewPet = {
        name: "Fluffy's Pet & Co. (2024)",
        userId: primary.id,
        animalType: 'cat',
        species: 'Maine Coon™',
        notes: 'Special chars: àáâãäå æç èéêë ìíîï ñ òóôõö øù úûüý',
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.name).toBe("Fluffy's Pet & Co. (2024)");
      expect(result.species).toBe('Maine Coon™');
      expect(result.notes).toBe('Special chars: àáâãäå æç èéêë ìíîï ñ òóôõö øù úûüý');
    });
  });
});