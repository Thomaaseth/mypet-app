import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import type { NewPet } from '../../db/schema/pets';
import { BadRequestError, NotFoundError } from '../../middleware/errors';
import { getDatabaseUrl } from './../../config'
import { PetsService } from '../pets.service';
import { db } from '../../db';

describe('PetsService', () => {
  beforeEach(async () => {
    // Clean database before each test
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 TEST_DATABASE_URL:', process.env.TEST_DATABASE_URL);
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL);
    console.log('🔍 getDatabaseUrl():', getDatabaseUrl());
    await db.delete(schema.pets);
    await db.delete(schema.user);

    // Insert test user
    await db.insert(schema.user).values({
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  describe('getUserPets', () => {
    it('should return all active pets for a user', async () => {
      // Arrange - Insert test pets
      await db.insert(schema.pets).values([
        {
          userId: 'test-user-123',
          name: 'Fluffy',
          animalType: 'cat',
          species: 'Persian',
          isActive: true,
        },
        {
          userId: 'test-user-123',
          name: 'Buddy',
          animalType: 'dog',
          species: 'Golden Retriever',
          isActive: true,
        },
      ]);

      // Act
      const result = await PetsService.getUserPets('test-user-123');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(pet => pet.userId === 'test-user-123')).toBe(true);
      expect(result.every(pet => pet.isActive)).toBe(true);
      
      const names = result.map(pet => pet.name);
      expect(names).toContain('Fluffy');
      expect(names).toContain('Buddy');
    });

    it('should return pets in newest-first order', async () => {
      // Arrange - Insert pets with slight delay to ensure different timestamps
      const [firstPet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'First Pet',
        animalType: 'cat',
      }).returning();
      
      // Small delay to ensure different creation time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const [secondPet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'Second Pet',
        animalType: 'dog',
      }).returning();

      // Act
      const result = await PetsService.getUserPets('test-user-123');

      // Assert - Should be ordered by newest first
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Second Pet'); // Newer pet first
      expect(result[1].name).toBe('First Pet');
    });

    it('should not return inactive pets', async () => {
      // Arrange
      await db.insert(schema.pets).values([
        {
          userId: 'test-user-123',
          name: 'Active Pet',
          animalType: 'cat',
          isActive: true,
        },
        {
          userId: 'test-user-123',
          name: 'Inactive Pet',
          animalType: 'dog',
          isActive: false,
        },
      ]);

      // Act
      const result = await PetsService.getUserPets('test-user-123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active Pet');
    });

    it('should return empty array when user has no pets', async () => {
      // Act
      const result = await PetsService.getUserPets('test-user-123');

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return pets for the specified user', async () => {
      // Arrange
      await db.insert(schema.user).values({
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com',
      });

      await db.insert(schema.pets).values([
        {
          userId: 'test-user-123',
          name: 'My Pet',
          animalType: 'cat',
        },
        {
          userId: 'other-user-456',
          name: 'Other Pet',
          animalType: 'dog',
        },
      ]);

      // Act
      const result = await PetsService.getUserPets('test-user-123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Pet');
      expect(result[0].userId).toBe('test-user-123');
    });

    it('should handle empty userId gracefully', async () => {
      // Act
      const result = await PetsService.getUserPets('');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getPetById', () => {
    it('should return pet when found and belongs to user', async () => {
      // Arrange
      const [insertedPet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'Fluffy',
        animalType: 'cat',
        species: 'Persian',
      }).returning();

      // Act
      const result = await PetsService.getPetById(insertedPet.id, 'test-user-123');

      // Assert
      expect(result.id).toBe(insertedPet.id);
      expect(result.name).toBe('Fluffy');
      expect(result.userId).toBe('test-user-123');
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      // Use a properly formatted UUID that doesn't exist
      const nonExistentId = randomUUID();
      
      // Act & Assert
      await expect(
        PetsService.getPetById(nonExistentId, 'test-user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      // Arrange
      await db.insert(schema.user).values({
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com',
      });

      const [insertedPet] = await db.insert(schema.pets).values({
        userId: 'other-user-456',
        name: 'Other User Pet',
        animalType: 'cat',
      }).returning();

      // Act & Assert
      await expect(
        PetsService.getPetById(insertedPet.id, 'test-user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet is inactive', async () => {
      // Arrange
      const [insertedPet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'Inactive Pet',
        animalType: 'cat',
        isActive: false,
      }).returning();

      // Act & Assert
      await expect(
        PetsService.getPetById(insertedPet.id, 'test-user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle invalid UUID format', async () => {
      // Act & Assert - Should throw BadRequestError due to UUID format error
      await expect(
        PetsService.getPetById('invalid-uuid', 'test-user-123')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('createPet', () => {
    it('should create pet with valid data', async () => {
      // Arrange
      const newPetData: NewPet = {
        name: 'Fluffy',
        userId: 'test-user-123',
        animalType: 'cat',
        species: 'Persian',
        gender: 'female',
        weightUnit: 'kg',
      };

      // Act
      const result = await PetsService.createPet(newPetData);

      // Assert
      expect(result.name).toBe('Fluffy');
      expect(result.userId).toBe('test-user-123');
      expect(result.animalType).toBe('cat');
      expect(result.species).toBe('Persian');
      expect(result.isActive).toBe(true);
      expect(result.id).toBeDefined();
      
      // Verify it was saved to database
      const savedPets = await db.select().from(schema.pets);
      expect(savedPets).toHaveLength(1);
    });

    it('should create pet with minimal required data', async () => {
      // Arrange - Only required fields
      const newPetData: NewPet = {
        name: 'Basic Pet',
        userId: 'test-user-123',
        animalType: 'dog',
      };

      // Act
      const result = await PetsService.createPet(newPetData);

      // Assert
      expect(result.name).toBe('Basic Pet');
      expect(result.userId).toBe('test-user-123');
      expect(result.animalType).toBe('dog');
      expect(result.species).toBeNull();
      expect(result.gender).toBe('unknown'); // Default value
      expect(result.weightUnit).toBe('kg'); // Default value
    });

    it('should throw BadRequestError when name is missing', async () => {
      const invalidData = {
        userId: 'test-user-123',
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
      const invalidData: NewPet = {
        name: '',
        userId: 'test-user-123',
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
      const newPetData: NewPet = {
        name: 'Fluffy',
        userId: 'test-user-123',
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
      const newPetData: NewPet = {
        name: 'Max',
        userId: 'test-user-123',
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
      expect(result.weight).toBe('25.50'); // Database returns decimal with trailing zeros
      expect(result.isNeutered).toBe(true);
      expect(result.microchipNumber).toBe('ABC123456789');
      expect(result.notes).toBe('Very friendly dog');
    });
  });

  describe('updatePet', () => {
    let testPetId: string;

    beforeEach(async () => {
      // Create a test pet for update operations
      const [pet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'Original Name',
        animalType: 'cat',
        species: 'Persian',
      }).returning();
      testPetId = pet.id;
    });

    it('should update pet with valid data', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Name',
        species: 'Maine Coon',
        weight: '4.5',
      };

      // Act
      const result = await PetsService.updatePet(testPetId, 'test-user-123', updateData);

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(result.species).toBe('Maine Coon');
      expect(result.weight).toBe('4.50'); // Database returns decimal with trailing zeros
      expect(result.updatedAt).toBeDefined();
    });

    it('should update only provided fields', async () => {
      // Arrange
      const updateData = { name: 'New Name Only' };

      // Act
      const result = await PetsService.updatePet(testPetId, 'test-user-123', updateData);

      // Assert
      expect(result.name).toBe('New Name Only');
      expect(result.species).toBe('Persian'); // Original value unchanged
    });

    it('should convert empty strings to null', async () => {
      // Arrange
      const updateData = {
        species: '',
        notes: '',
        microchipNumber: '',
      };

      // Act
      const result = await PetsService.updatePet(testPetId, 'test-user-123', updateData);

      // Assert
      expect(result.species).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.microchipNumber).toBeNull();
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const nonExistentId = randomUUID();
      const updateData = { name: 'New Name' };

      await expect(
        PetsService.updatePet(nonExistentId, 'test-user-123', updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      // Arrange
      await db.insert(schema.user).values({
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com',
      });

      const updateData = { name: 'Hacker Name' };

      // Act & Assert
      await expect(
        PetsService.updatePet(testPetId, 'other-user-456', updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet is inactive', async () => {
      // Arrange - Make pet inactive first
      await db.update(schema.pets)
        .set({ isActive: false })
        .where(eq(schema.pets.id, testPetId));

      const updateData = { name: 'Should Not Work' };

      // Act & Assert
      await expect(
        PetsService.updatePet(testPetId, 'test-user-123', updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle invalid UUID format', async () => {
      const updateData = { name: 'New Name' };

      await expect(
        PetsService.updatePet('invalid-uuid', 'test-user-123', updateData)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deletePet (soft delete)', () => {
    let testPetId: string;

    beforeEach(async () => {
      const [pet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'Pet to Delete',
        animalType: 'cat',
      }).returning();
      testPetId = pet.id;
    });

    it('should soft delete pet', async () => {
      // Act
      await PetsService.deletePet(testPetId, 'test-user-123');

      // Assert - Pet should be marked as inactive
      const [deletedPet] = await db.select()
        .from(schema.pets)
        .where(eq(schema.pets.id, testPetId));

      expect(deletedPet.isActive).toBe(false);
      expect(deletedPet.updatedAt).toBeDefined();
    });

    it('should not affect getPetById after soft delete', async () => {
      // Act
      await PetsService.deletePet(testPetId, 'test-user-123');

      // Assert - getPetById should throw NotFoundError for soft deleted pet
      await expect(
        PetsService.getPetById(testPetId, 'test-user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const nonExistentId = randomUUID();

      await expect(
        PetsService.deletePet(nonExistentId, 'test-user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      await db.insert(schema.user).values({
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com',
      });

      await expect(
        PetsService.deletePet(testPetId, 'other-user-456')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('hardDeletePet', () => {
    let testPetId: string;

    beforeEach(async () => {
      const [pet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'Pet to Hard Delete',
        animalType: 'dog',
      }).returning();
      testPetId = pet.id;
    });

    it('should permanently delete pet', async () => {
      // Act
      await PetsService.hardDeletePet(testPetId, 'test-user-123');

      // Assert - Pet should be completely removed
      const deletedPets = await db.select()
        .from(schema.pets)
        .where(eq(schema.pets.id, testPetId));

      expect(deletedPets).toHaveLength(0);
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      const nonExistentId = randomUUID();

      await expect(
        PetsService.hardDeletePet(nonExistentId, 'test-user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      await db.insert(schema.user).values({
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com',
      });

      await expect(
        PetsService.hardDeletePet(testPetId, 'other-user-456')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserPetCount', () => {
    it('should return correct count of active pets', async () => {
      // Arrange
      await db.insert(schema.pets).values([
        { userId: 'test-user-123', name: 'Pet 1', animalType: 'cat', isActive: true },
        { userId: 'test-user-123', name: 'Pet 2', animalType: 'dog', isActive: true },
        { userId: 'test-user-123', name: 'Pet 3', animalType: 'cat', isActive: false }, // Inactive
      ]);

      // Act
      const result = await PetsService.getUserPetCount('test-user-123');

      // Assert
      expect(result).toBe(2);
    });

    it('should return 0 when user has no pets', async () => {
      // Act
      const result = await PetsService.getUserPetCount('test-user-123');

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when user has only inactive pets', async () => {
      // Arrange
      await db.insert(schema.pets).values([
        { userId: 'test-user-123', name: 'Inactive Pet 1', animalType: 'cat', isActive: false },
        { userId: 'test-user-123', name: 'Inactive Pet 2', animalType: 'dog', isActive: false },
      ]);

      // Act
      const result = await PetsService.getUserPetCount('test-user-123');

      // Assert
      expect(result).toBe(0);
    });

    it('should not count other users pets', async () => {
      // Arrange
      await db.insert(schema.user).values({
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com',
      });

      await db.insert(schema.pets).values([
        { userId: 'test-user-123', name: 'My Pet', animalType: 'cat', isActive: true },
        { userId: 'other-user-456', name: 'Other Pet 1', animalType: 'dog', isActive: true },
        { userId: 'other-user-456', name: 'Other Pet 2', animalType: 'cat', isActive: true },
      ]);

      // Act
      const result = await PetsService.getUserPetCount('test-user-123');

      // Assert
      expect(result).toBe(1); // Only counts test-user-123's pets
    });

    it('should handle invalid userId gracefully', async () => {
      // Act
      const result = await PetsService.getUserPetCount('non-existent-user');

      // Assert
      expect(result).toBe(0);
    });

    it('should handle empty userId gracefully', async () => {
      // Act
      const result = await PetsService.getUserPetCount('');

      // Assert
      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Note: This is harder to test without mocking the database
      // In a real scenario, you might want to mock the db call to throw an error
      // For now, we test normal error handling by passing null/undefined
      const result = await PetsService.getUserPetCount(null as any);
      expect(result).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent operations on the same pet', async () => {
      // Arrange
      const [pet] = await db.insert(schema.pets).values({
        userId: 'test-user-123',
        name: 'Concurrent Pet',
        animalType: 'cat',
      }).returning();

      // Act - Simulate concurrent updates
      const updatePromises = [
        PetsService.updatePet(pet.id, 'test-user-123', { name: 'Updated Name 1' }),
        PetsService.updatePet(pet.id, 'test-user-123', { species: 'Persian' }),
        PetsService.updatePet(pet.id, 'test-user-123', { weight: '5.0' }),
      ];

      const results = await Promise.all(updatePromises);

      // Assert - All operations should succeed
      results.forEach(result => {
        expect(result.id).toBe(pet.id);
      });
    });

    it('should handle very long names and strings', async () => {
      // Arrange
      const longName = 'A'.repeat(100); // Test name at limit
      const longSpecies = 'B'.repeat(50); // Test species at limit
      const longNotes = 'C'.repeat(1000); // Very long notes

      const newPetData: NewPet = {
        name: longName,
        userId: 'test-user-123',
        animalType: 'cat',
        species: longSpecies,
        notes: longNotes,
      };

      // Act
      const result = await PetsService.createPet(newPetData);

      // Assert
      expect(result.name).toBe(longName);
      expect(result.species).toBe(longSpecies);
      expect(result.notes).toBe(longNotes);
    });

    it('should preserve data types correctly', async () => {
      // Arrange
      const newPetData: NewPet = {
        name: 'Type Test Pet',
        userId: 'test-user-123',
        animalType: 'dog',
        weight: '25.75', // Decimal as string
        isNeutered: true, // Boolean
        birthDate: '2020-12-25', // Date string
      };

      // Act
      const result = await PetsService.createPet(newPetData);

      // Assert
      expect(result.weight).toBe('25.75');
      expect(result.isNeutered).toBe(true);
      expect(result.birthDate).toBe('2020-12-25');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle special characters in text fields', async () => {
      // Arrange
      const newPetData: NewPet = {
        name: "Fluffy's Pet & Co. (2024)",
        userId: 'test-user-123',
        animalType: 'cat',
        species: 'Maine Coon™',
        notes: 'Special chars: àáâãäå æç èéêë ìíîï ñ òóôõö øù úûüý',
      };

      // Act
      const result = await PetsService.createPet(newPetData);

      // Assert
      expect(result.name).toBe("Fluffy's Pet & Co. (2024)");
      expect(result.species).toBe('Maine Coon™');
      expect(result.notes).toBe('Special chars: àáâãäå æç èéêë ìíîï ñ òóôõö øù úûüý');
    });
  });
});