import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schema';
import type { WeightEntryFormData } from '../../db/schema/weight-entries';
import { BadRequestError, NotFoundError } from '../../middleware/errors';
import { WeightEntriesService } from '../weight-entries.service';
import { db } from '../../db';
import { DatabaseTestUtils } from '../../test/database-test-utils';

describe('WeightEntriesService', () => {
  describe('getWeightEntries', () => {
    it('should return all weight entries for a pet with correct weight unit', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      await db.insert(schema.weightEntries).values([
        {
          petId: testPet.id,
          weight: '5.50',
          date: '2024-01-15',
        },
        {
          petId: testPet.id,
          weight: '5.75',
          date: '2024-01-20',
        },
      ]);

      const result = await WeightEntriesService.getWeightEntries(testPet.id, primary.id);

      expect(result.weightEntries).toHaveLength(2);
      expect(result.weightUnit).toBe('kg');
      expect(result.weightEntries[0].date).toBe('2024-01-15');
      expect(result.weightEntries[1].date).toBe('2024-01-20');
    });

    it('should return empty array when pet has no weight entries', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);

      const result = await WeightEntriesService.getWeightEntries(testPet.id, primary.id);

      expect(result.weightEntries).toEqual([]);
      expect(result.weightUnit).toBe('kg');
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);

      await expect(
        WeightEntriesService.getWeightEntries(otherUserPet.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getWeightEntryById', () => {
    it('should return specific weight entry when found', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: testPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      const result = await WeightEntriesService.getWeightEntryById(testPet.id, entry.id, primary.id);

      expect(result.id).toBe(entry.id);
      expect(result.petId).toBe(testPet.id);
      expect(result.weight).toBe('5.50');
      expect(result.date).toBe('2024-01-15');
    });

    it('should throw NotFoundError when weight entry does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const nonExistentId = randomUUID();

      await expect(
        WeightEntriesService.getWeightEntryById(testPet.id, nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: otherUserPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      await expect(
        WeightEntriesService.getWeightEntryById(otherUserPet.id, entry.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createWeightEntry', () => {
    it('should create weight entry with valid data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const entryData: WeightEntryFormData = {
        weight: '5.50',
        date: '2024-01-15',
      };

      const result = await WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData);

      expect(result.petId).toBe(testPet.id);
      expect(result.weight).toBe('5.50');
      expect(result.date).toBe('2024-01-15');
      expect(result.id).toBeDefined();

      const savedEntries = await db.select().from(schema.weightEntries);
      expect(savedEntries).toHaveLength(1);
    });

    it('should throw BadRequestError when required fields are missing', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const missingWeight = { date: '2024-01-15' } as WeightEntryFormData;
      const missingDate = { weight: '5.50' } as WeightEntryFormData;

      await expect(
        WeightEntriesService.createWeightEntry(testPet.id, primary.id, missingWeight)
      ).rejects.toThrow(BadRequestError);

      await expect(
        WeightEntriesService.createWeightEntry(testPet.id, primary.id, missingDate)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when weight is invalid', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const invalidWeights = [
        { weight: 'not-a-number', date: '2024-01-15' },
        { weight: '0', date: '2024-01-15' },
        { weight: '-5.50', date: '2024-01-15' },
        { weight: '', date: '2024-01-15' },
      ];

      for (const invalidData of invalidWeights) {
        await expect(
          WeightEntriesService.createWeightEntry(testPet.id, primary.id, invalidData as WeightEntryFormData)
        ).rejects.toThrow(BadRequestError);
      }
    });

    it('should throw BadRequestError when date is in the future', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const entryData: WeightEntryFormData = {
        weight: '5.50',
        date: futureDate,
      };

      await expect(
        WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData)
      ).rejects.toThrow(BadRequestError);
      await expect(
        WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData)
      ).rejects.toThrow('Date cannot be in the future');
    });

    it('should accept today as valid date', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const today = new Date().toISOString().split('T')[0];
      const entryData: WeightEntryFormData = {
        weight: '5.50',
        date: today,
      };

      const result = await WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData);
      expect(result.date).toBe(today);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      
      const entryData: WeightEntryFormData = {
        weight: '5.50',
        date: '2024-01-15',
      };

      await expect(
        WeightEntriesService.createWeightEntry(otherUserPet.id, primary.id, entryData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateWeightEntry', () => {
    it('should update weight entry with valid data', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: testPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      const updateData = {
        weight: '6.00',
        date: '2024-01-20',
      };

      const result = await WeightEntriesService.updateWeightEntry(testPet.id, entry.id, primary.id, updateData);

      expect(result.weight).toBe('6.00');
      expect(result.date).toBe('2024-01-20');
    });

    it('should update only provided fields', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: testPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      const updateData = { weight: '6.25' };

      const result = await WeightEntriesService.updateWeightEntry(testPet.id, entry.id, primary.id, updateData);

      expect(result.weight).toBe('6.25');
      expect(result.date).toBe('2024-01-15');
    });

    it('should throw BadRequestError when weight is invalid', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: testPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      const invalidUpdates = [
        { weight: 'invalid' },
        { weight: '0' },
        { weight: '-1.5' },
      ];

      for (const updateData of invalidUpdates) {
        await expect(
          WeightEntriesService.updateWeightEntry(testPet.id, entry.id, primary.id, updateData)
        ).rejects.toThrow(BadRequestError);
      }
    });

    it('should throw NotFoundError when weight entry does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const nonExistentId = randomUUID();
      const updateData = { weight: '6.00' };

      await expect(
        WeightEntriesService.updateWeightEntry(testPet.id, nonExistentId, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: otherUserPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      const updateData = { weight: '6.00' };

      await expect(
        WeightEntriesService.updateWeightEntry(otherUserPet.id, entry.id, primary.id, updateData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteWeightEntry', () => {
    it('should delete weight entry successfully', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: testPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      await WeightEntriesService.deleteWeightEntry(testPet.id, entry.id, primary.id);

      const deletedEntries = await db.select()
        .from(schema.weightEntries)
        .where(eq(schema.weightEntries.id, entry.id));

      expect(deletedEntries).toHaveLength(0);
    });

    it('should not affect other weight entries', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const [firstEntry] = await db.insert(schema.weightEntries).values({
        petId: testPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      const [otherEntry] = await db.insert(schema.weightEntries).values({
        petId: testPet.id,
        weight: '6.00',
        date: '2024-01-20',
      }).returning();

      await WeightEntriesService.deleteWeightEntry(testPet.id, firstEntry.id, primary.id);

      const remainingEntries = await db.select().from(schema.weightEntries);
      expect(remainingEntries).toHaveLength(1);
      expect(remainingEntries[0].id).toBe(otherEntry.id);
    });

    it('should throw NotFoundError when weight entry does not exist', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      const nonExistentId = randomUUID();

      await expect(
        WeightEntriesService.deleteWeightEntry(testPet.id, nonExistentId, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when pet belongs to different user', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      const [entry] = await db.insert(schema.weightEntries).values({
        petId: otherUserPet.id,
        weight: '5.50',
        date: '2024-01-15',
      }).returning();

      await expect(
        WeightEntriesService.deleteWeightEntry(otherUserPet.id, entry.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Security and Authorization', () => {
    it('should prevent unauthorized access across all operations', async () => {
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      const entryData: WeightEntryFormData = { weight: '6.00', date: '2024-01-15' };

      await expect(WeightEntriesService.getWeightEntries(otherUserPet.id, primary.id))
        .rejects.toThrow(NotFoundError);
      await expect(WeightEntriesService.createWeightEntry(otherUserPet.id, primary.id, entryData))
        .rejects.toThrow(NotFoundError);
    });

    it('should prevent access to inactive pets', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [inactivePet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'Inactive Pet',
        animalType: 'cat',
        isActive: false,
      }).returning();

      const entryData: WeightEntryFormData = { weight: '6.00', date: '2024-01-15' };

      await expect(WeightEntriesService.getWeightEntries(inactivePet.id, primary.id))
        .rejects.toThrow(NotFoundError);
      await expect(WeightEntriesService.createWeightEntry(inactivePet.id, primary.id, entryData))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity with pets table', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const entryData: WeightEntryFormData = {
        weight: '5.50',
        date: '2024-01-15',
      };

      const result = await WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData);

      const entry = await db.select()
        .from(schema.weightEntries)
        .where(eq(schema.weightEntries.id, result.id));

      expect(entry[0].petId).toBe(testPet.id);
    });

    it('should handle different weight units correctly', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      
      const [kgPet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'KG Pet',
        animalType: 'cat',
        weightUnit: 'kg',
      }).returning();

      const [lbsPet] = await db.insert(schema.pets).values({
        userId: primary.id,
        name: 'LBS Pet',
        animalType: 'dog',
        weightUnit: 'lbs',
      }).returning();

      await WeightEntriesService.createWeightEntry(kgPet.id, primary.id, {
        weight: '5.50',
        date: '2024-01-15',
      });

      await WeightEntriesService.createWeightEntry(lbsPet.id, primary.id, {
        weight: '12.25',
        date: '2024-01-15',
      });

      const kgResult = await WeightEntriesService.getWeightEntries(kgPet.id, primary.id);
      const lbsResult = await WeightEntriesService.getWeightEntries(lbsPet.id, primary.id);

      expect(kgResult.weightUnit).toBe('kg');
      expect(lbsResult.weightUnit).toBe('lbs');
    });
  });

  describe('Edge Cases', () => {
    it('should enforce realistic weight limits based on animal type', async () => {
        const { primary } = await DatabaseTestUtils.createTestUsers();
        
        // Cat realistic range: 2-10kg (4-22lbs)
        const [cat] = await db.insert(schema.pets).values({
          userId: primary.id,
          name: 'Test Cat',
          animalType: 'cat',
        }).returning();
        
        // Dog realistic range: 1-90kg (2-200lbs) 
        const [dog] = await db.insert(schema.pets).values({
          userId: primary.id,
          name: 'Test Dog', 
          animalType: 'dog',
        }).returning();
      
        // Valid weights should work
        await expect(
          WeightEntriesService.createWeightEntry(cat.id, primary.id, { weight: '4.5', date: '2024-01-15' })
        ).resolves.toBeDefined();
        
        await expect(
          WeightEntriesService.createWeightEntry(dog.id, primary.id, { weight: '25.0', date: '2024-01-15' })
        ).resolves.toBeDefined();
      
        // Unrealistic weights should fail
        await expect(
          WeightEntriesService.createWeightEntry(cat.id, primary.id, { weight: '50.0', date: '2024-01-16' })
        ).rejects.toThrow('Weight 50kg is outside realistic range for cat (1-15kg)');
        
        await expect(
          WeightEntriesService.createWeightEntry(dog.id, primary.id, { weight: '150.0', date: '2024-01-16' })
        ).rejects.toThrow('Weight 150kg is outside realistic range for dog (0.5-90kg)');
      });

    it('should update existing entry when same date is provided (upsert)', async () => {
      const { primary } = await DatabaseTestUtils.createTestUsers();
      const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
      
      const firstEntry = { weight: '5.50', date: '2024-01-15' };
      const updatedEntry = { weight: '5.75', date: '2024-01-15' }; // Same date, different weight
      
      // Create first entry
      const first = await WeightEntriesService.createWeightEntry(testPet.id, primary.id, firstEntry);
      
      // "Create" second entry with same date - should update existing
      const updated = await WeightEntriesService.createWeightEntry(testPet.id, primary.id, updatedEntry);
      
      // Should be same entry ID (updated, not new)
      expect(updated.id).toBe(first.id);
      expect(updated.weight).toBe('5.75');
      
      // Should still have only 1 entry in database
      const allEntries = await db.select().from(schema.weightEntries);
      expect(allEntries).toHaveLength(1);
    });
  });
});