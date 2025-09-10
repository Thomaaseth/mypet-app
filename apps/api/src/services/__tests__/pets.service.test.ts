import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import * as schema from '../../db/schema';
import type { NewPet } from '../../db/schema/pets';
import { BadRequestError, NotFoundError } from '../../middleware/errors';
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
      // Arrange - Insert test pets (let IDs auto-generate)
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
  });

  describe('getPetById', () => {
    it('should return pet when found and belongs to user', async () => {
      // Arrange - Let database generate UUID
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
  });

  // Rest of your tests stay exactly the same...
  describe('createPet', () => {
    it('should create pet with valid data', async () => {
      const newPetData: NewPet = {
        name: 'Fluffy',
        userId: 'test-user-123',
        animalType: 'cat',
        species: 'Persian',
        gender: 'female',
        weightUnit: 'kg',
      };

      const result = await PetsService.createPet(newPetData);

      expect(result.name).toBe('Fluffy');
      expect(result.userId).toBe('test-user-123');
      expect(result.animalType).toBe('cat');
      expect(result.species).toBe('Persian');
      expect(result.isActive).toBe(true);
      
      const savedPets = await db.select().from(schema.pets);
      expect(savedPets).toHaveLength(1);
    });

    it('should throw BadRequestError when name is missing', async () => {
      const invalidData = {
        userId: 'test-user-123',
        animalType: 'cat',
      } as NewPet;

      await expect(PetsService.createPet(invalidData)).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when userId is missing', async () => {
      const invalidData = {
        name: 'Fluffy',
        animalType: 'cat',
      } as NewPet;

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
  });

  describe('getUserPetCount', () => {
    it('should return correct count of active pets', async () => {
      await db.insert(schema.pets).values([
        { userId: 'test-user-123', name: 'Pet 1', animalType: 'cat', isActive: true },
        { userId: 'test-user-123', name: 'Pet 2', animalType: 'dog', isActive: true },
        { userId: 'test-user-123', name: 'Pet 3', animalType: 'cat', isActive: false },
      ]);

      const result = await PetsService.getUserPetCount('test-user-123');

      expect(result).toBe(2);
    });

    it('should return 0 when user has no pets', async () => {
      const result = await PetsService.getUserPetCount('test-user-123');
      expect(result).toBe(0);
    });
  });
});