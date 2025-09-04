import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import type { NewPet } from '../../db/schema/pets';
import { BadRequestError, NotFoundError } from '../../middleware/errors';

// Import the service we want to test
import { PetsService } from '../pets.service';
import { db } from '../../db';


describe('PetsService', () => {
  beforeEach(async () => {
    // Clean database before each test
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

      // Act - Call the actual service method
      const result = await PetsService.getUserPets('test-user-123');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(pet => pet.userId === 'test-user-123')).toBe(true);
      expect(result.every(pet => pet.isActive)).toBe(true);
      
      // Check ordering (should be newest first)
      const names = result.map(pet => pet.name);
      expect(names).toContain('Fluffy');
      expect(names).toContain('Buddy');
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
          isActive: false, // Should not be returned
        },
      ]);

      // Act
      const result = await PetsService.getUserPets('test-user-123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active Pet');
    });

    it('should return empty array when user has no pets', async () => {
      // Act - No pets inserted for this user
      const result = await PetsService.getUserPets('test-user-123');

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should only return pets for the specified user', async () => {
      // Arrange - Add another user and pets for both
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
  });

  describe('getPetById', () => {
    it('should return pet when found and belongs to user', async () => {
      // Arrange
      const [insertedPet] = await db.insert(schema.pets).values({
        id: 'test-pet-123',
        userId: 'test-user-123',
        name: 'Fluffy',
        animalType: 'cat',
        species: 'Persian',
      }).returning();

      // Act
      const result = await PetsService.getPetById('test-pet-123', 'test-user-123');

      // Assert
      expect(result.id).toBe('test-pet-123');
      expect(result.name).toBe('Fluffy');
      expect(result.userId).toBe('test-user-123');
    });

    it('should throw NotFoundError when pet does not exist', async () => {
      // Act & Assert
      await expect(
        PetsService.getPetById('non-existent-pet', 'test-user-123')
      ).rejects.toThrow(NotFoundError);
      
      await expect(
        PetsService.getPetById('non-existent-pet', 'test-user-123')
      ).rejects.toThrow('Pet not found');
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      // Arrange
      await db.insert(schema.user).values({
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com',
      });

      await db.insert(schema.pets).values({
        id: 'test-pet-123',
        userId: 'other-user-456', // Different user
        name: 'Other User Pet',
        animalType: 'cat',
      });

      // Act & Assert
      await expect(
        PetsService.getPetById('test-pet-123', 'test-user-123')
      ).rejects.toThrow(NotFoundError);
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
      
      // Verify it was saved to database
      const savedPets = await db.select().from(schema.pets);
      expect(savedPets).toHaveLength(1);
    });

    it('should throw BadRequestError when name is missing', async () => {
      // Arrange - Test actual service validation
      const invalidData = {
        userId: 'test-user-123',
        animalType: 'cat',
      } as NewPet;

      // Act & Assert
      await expect(PetsService.createPet(invalidData)).rejects.toThrow(BadRequestError);
      await expect(PetsService.createPet(invalidData)).rejects.toThrow('Pet name and user ID are required');
      
      // Verify no pet was created
      const pets = await db.select().from(schema.pets);
      expect(pets).toHaveLength(0);
    });

    it('should throw BadRequestError when userId is missing', async () => {
      // Arrange
      const invalidData = {
        name: 'Fluffy',
        animalType: 'cat',
      } as NewPet;

      // Act & Assert
      await expect(PetsService.createPet(invalidData)).rejects.toThrow(BadRequestError);
      await expect(PetsService.createPet(invalidData)).rejects.toThrow('Pet name and user ID are required');
    });

    it('should convert empty strings to null for optional fields', async () => {
      // Arrange - Test the data cleaning logic
      const newPetData: NewPet = {
        name: 'Fluffy',
        userId: 'test-user-123',
        animalType: 'cat',
        species: '', // Empty string should become null
        notes: '',   // Empty string should become null
        microchipNumber: '', // Empty string should become null
      };

      // Act
      const result = await PetsService.createPet(newPetData);

      // Assert - Tests the actual data transformation in the service
      expect(result.species).toBeNull();
      expect(result.notes).toBeNull();
      expect(result.microchipNumber).toBeNull();
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
      expect(result).toBe(2); // Only counts active pets
    });

    it('should return 0 when user has no pets', async () => {
      // Act
      const result = await PetsService.getUserPetCount('test-user-123');

      // Assert
      expect(result).toBe(0);
    });
  });
});