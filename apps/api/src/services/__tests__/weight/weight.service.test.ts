import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db';
import { BadRequestError, NotFoundError } from '../../../middleware/errors';
import { WeightEntriesService } from '../../weight-entries.service';
import { db } from '../../../db';
import { setupUserAndPet } from './helpers/setup';
import { makeWeightEntryData, makeMultipleWeightEntries, makeInvalidWeightData } from './helpers/factories';
import type { WeightEntry, NewWeightEntry, WeightEntryFormData } from '../../../db/schema/weight-entries';

describe('WeightEntriesService', () => {
    describe('getWeightEntries', () => {
      it('should return all weight entries for a pet with correct weight unit', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        await db.insert(schema.weightEntries).values(
          makeMultipleWeightEntries(testPet.id, 2)
        );
  
        const result = await WeightEntriesService.getWeightEntries(testPet.id, primary.id);
  
        expect(result.weightEntries).toHaveLength(2);
        expect(result.weightUnit).toBe('kg');
        expect(result.weightEntries[0].date).toBe('2024-01-15');
        expect(result.weightEntries[1].date).toBe('2024-01-16');
      });
  
      it('should return empty array when pet has no weight entries', async () => {
        const { primary, testPet } = await setupUserAndPet();
  
        const result = await WeightEntriesService.getWeightEntries(testPet.id, primary.id);
  
        expect(result.weightEntries).toEqual([]);
        expect(result.weightUnit).toBe('kg');
      });
  
      it('should throw NotFoundError when pet belongs to different user', async () => {
        const { primary, secondary } = await setupUserAndPet();
        const [otherUserPet] = await db.insert(schema.pets).values({
          userId: secondary.id,
          name: 'Other User Pet',
          animalType: 'cat',
          isActive: true,
        }).returning();
  
        await expect(
          WeightEntriesService.getWeightEntries(otherUserPet.id, primary.id)
        ).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('getWeightEntryById', () => {
      it('should return specific weight entry when found', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const [entry] = await db.insert(schema.weightEntries).values({
          ...makeWeightEntryData(),
          petId: testPet.id,
        }).returning();
  
        const result = await WeightEntriesService.getWeightEntryById(testPet.id, entry.id, primary.id);
  
        expect(result.id).toBe(entry.id);
        expect(result.weight).toBe('5.50');
        expect(result.weightUnit).toBe('kg');
        expect(result.date).toBe('2024-01-15');
        expect(result.petId).toBe(testPet.id);
      });
  
      it('should throw NotFoundError when entry does not exist', async () => {
        const { primary, testPet } = await setupUserAndPet();
        const nonExistentId = randomUUID();
  
        await expect(
          WeightEntriesService.getWeightEntryById(testPet.id, nonExistentId, primary.id)
        ).rejects.toThrow(NotFoundError);
      });
  
      it('should throw NotFoundError when pet belongs to different user', async () => {
        const { primary, secondary } = await setupUserAndPet();
        const [otherUserPet] = await db.insert(schema.pets).values({
          userId: secondary.id,
          name: 'Other User Pet',
          animalType: 'cat',
          isActive: true,
        }).returning();
        
        const [entry] = await db.insert(schema.weightEntries).values({
          ...makeWeightEntryData(),
          petId: otherUserPet.id,
        }).returning();
  
        await expect(
          WeightEntriesService.getWeightEntryById(otherUserPet.id, entry.id, primary.id)
        ).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('createWeightEntry', () => {
      it('should create weight entry with valid data', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const result = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        expect(result.weight).toBe('5.50');
        expect(result.weightUnit).toBe('kg');
        expect(result.date).toBe('2024-01-15');
        expect(result.petId).toBe(testPet.id);
        expect(result.id).toBeDefined();
  
        const savedEntries = await db.select()
        .from(schema.weightEntries)
        .where(eq(schema.weightEntries.petId, testPet.id));
        expect(savedEntries).toHaveLength(1);
      });
  
      it('should throw BadRequestError when required fields are missing', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const missingWeight = { date: '2024-01-15' } as WeightEntryFormData;
        const missingDate = { weight: '5.50' } as WeightEntryFormData;
  
        await expect(
          WeightEntriesService.createWeightEntry(testPet.id, primary.id, missingWeight)
        ).rejects.toThrow(BadRequestError);
  
        await expect(
          WeightEntriesService.createWeightEntry(testPet.id, primary.id, missingDate)
        ).rejects.toThrow(BadRequestError);
      });
  
      it('should throw BadRequestError for invalid weight values', async () => {
        const { primary, testPet } = await setupUserAndPet();
  
        const invalidWeights = [
          makeWeightEntryData({ weight: 'not-a-number' }),
          makeWeightEntryData({ weight: '0' }),
          makeWeightEntryData({ weight: '-5.50' }),
          makeWeightEntryData({ weight: '' }),
        ];
  
        for (const invalidData of invalidWeights) {
          await expect(
            WeightEntriesService.createWeightEntry(testPet.id, primary.id, invalidData)
          ).rejects.toThrow(BadRequestError);
        }
      });
  
      it('should throw BadRequestError when date is in the future', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const futureDate = tomorrow.toISOString().split('T')[0];
  
        const entryData = makeWeightEntryData({ date: futureDate });
  
        await expect(
          WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData)
        ).rejects.toThrow(BadRequestError);
        await expect(
          WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData)
        ).rejects.toThrow('Date cannot be in the future');
      });
  
      it('should throw BadRequestError for truly invalid date formats', async () => {
        const { primary, testPet } = await setupUserAndPet();
  
        await expect(
          WeightEntriesService.createWeightEntry(
            testPet.id, 
            primary.id, 
            makeWeightEntryData({ date: 'invalid-date' })
          )
        ).rejects.toThrow(BadRequestError);
      });
  
      it('should accept today as valid date', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const today = new Date().toISOString().split('T')[0];
        const entryData = makeWeightEntryData({ date: today });
  
        const result = await WeightEntriesService.createWeightEntry(testPet.id, primary.id, entryData);
        expect(result.date).toBe(today);
      });
  
      it('should throw NotFoundError when pet belongs to different user', async () => {
        const { primary, secondary } = await setupUserAndPet();
        const [otherUserPet] = await db.insert(schema.pets).values({
          userId: secondary.id,
          name: 'Other User Pet',
          animalType: 'cat',
          isActive: true,
        }).returning();
        
        const entryData = makeWeightEntryData();
  
        await expect(
          WeightEntriesService.createWeightEntry(otherUserPet.id, primary.id, entryData)
        ).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('updateWeightEntry', () => {
      it('should update weight entry with valid data', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const created = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        const updateData = {
          weight: '6.00',
          date: '2024-01-20',
        };
  
        const result = await WeightEntriesService.updateWeightEntry(
          testPet.id, created.id, primary.id, updateData
        );
  
        expect(result.weight).toBe('6.00');
        expect(result.date).toBe('2024-01-20');
      });
  
      it('should update only provided fields', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const created = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        const updateData = { weight: '6.25' };
  
        const result = await WeightEntriesService.updateWeightEntry(
          testPet.id, created.id, primary.id, updateData
        );
  
        expect(result.weight).toBe('6.25');
        expect(result.date).toBe('2024-01-15'); // Unchanged
      });
  
      it('should throw BadRequestError for invalid weight values', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const created = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        const invalidUpdates = [
          { weight: 'invalid' },
          { weight: '0' },
          { weight: '-1.5' },
        ];
  
        for (const updateData of invalidUpdates) {
          await expect(
            WeightEntriesService.updateWeightEntry(testPet.id, created.id, primary.id, updateData)
          ).rejects.toThrow(BadRequestError);
        }
      });
  
      it('should throw NotFoundError when updating non-existent entry', async () => {
        const { primary, testPet } = await setupUserAndPet();
        const nonExistentId = randomUUID();
  
        await expect(
          WeightEntriesService.updateWeightEntry(
            testPet.id, 
            nonExistentId, 
            primary.id, 
            { weight: '6.00' }
          )
        ).rejects.toThrow(NotFoundError);
      });
  
      it('should throw NotFoundError when pet belongs to different user', async () => {
        const { primary, secondary } = await setupUserAndPet();
        const [otherUserPet] = await db.insert(schema.pets).values({
          userId: secondary.id,
          name: 'Other User Pet',
          animalType: 'cat',
          isActive: true,
        }).returning();
        
        const [entry] = await db.insert(schema.weightEntries).values({
          ...makeWeightEntryData(),
          petId: otherUserPet.id,
        }).returning();
  
        const updateData = { weight: '6.00' };
  
        await expect(
          WeightEntriesService.updateWeightEntry(otherUserPet.id, entry.id, primary.id, updateData)
        ).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('deleteWeightEntry', () => {
      it('should delete weight entry successfully', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const created = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        await WeightEntriesService.deleteWeightEntry(testPet.id, created.id, primary.id);
  
        const deletedEntry = await db.select()
          .from(schema.weightEntries)
          .where(eq(schema.weightEntries.id, created.id));
  
        expect(deletedEntry).toHaveLength(0);
      });
  
      it('should not affect other weight entries', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const firstCreated = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        const secondCreated = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData({ date: '2024-01-20', weight: '6.00' })
        );
  
        await WeightEntriesService.deleteWeightEntry(testPet.id, firstCreated.id, primary.id);
  
        const remainingEntries = await db.select()
        .from(schema.weightEntries)
        .where(eq(schema.weightEntries.petId, testPet.id));
        expect(remainingEntries).toHaveLength(1);
        
        expect(remainingEntries[0].id).toBe(secondCreated.id);
      });
  
      it('should throw NotFoundError when deleting non-existent entry', async () => {
        const { primary, testPet } = await setupUserAndPet();
        const nonExistentId = randomUUID();
  
        await expect(
          WeightEntriesService.deleteWeightEntry(testPet.id, nonExistentId, primary.id)
        ).rejects.toThrow(NotFoundError);
      });
  
      it('should throw NotFoundError when pet belongs to different user', async () => {
        const { primary, secondary } = await setupUserAndPet();
        const [otherUserPet] = await db.insert(schema.pets).values({
          userId: secondary.id,
          name: 'Other User Pet',
          animalType: 'cat',
          isActive: true,
        }).returning();
        
        const [entry] = await db.insert(schema.weightEntries).values({
          ...makeWeightEntryData(),
          petId: otherUserPet.id,
        }).returning();
  
        await expect(
          WeightEntriesService.deleteWeightEntry(otherUserPet.id, entry.id, primary.id)
        ).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('Security and Authorization', () => {
      it('should prevent unauthorized access across all operations', async () => {
        const { primary, secondary } = await setupUserAndPet();
        const [otherUserPet] = await db.insert(schema.pets).values({
          userId: secondary.id,
          name: 'Other User Pet',
          animalType: 'cat',
          isActive: true,
        }).returning();
        
        const entryData = makeWeightEntryData();
  
        await expect(WeightEntriesService.getWeightEntries(otherUserPet.id, primary.id))
          .rejects.toThrow(NotFoundError);
        await expect(WeightEntriesService.createWeightEntry(otherUserPet.id, primary.id, entryData))
          .rejects.toThrow(NotFoundError);
      });
  
      it('should prevent access to inactive pets', async () => {
        const { primary } = await setupUserAndPet();
        const [inactivePet] = await db.insert(schema.pets).values({
          userId: primary.id,
          name: 'Inactive Pet',
          animalType: 'cat',
          isActive: false,
        }).returning();
  
        const entryData = makeWeightEntryData();
  
        await expect(WeightEntriesService.getWeightEntries(inactivePet.id, primary.id))
          .rejects.toThrow(NotFoundError);
        await expect(WeightEntriesService.createWeightEntry(inactivePet.id, primary.id, entryData))
          .rejects.toThrow(NotFoundError);
      });
    });
  
    describe('Data Integrity', () => {
      it('should maintain referential integrity with pets table', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const result = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        const entry = await db.select()
          .from(schema.weightEntries)
          .where(eq(schema.weightEntries.id, result.id));
  
        expect(entry[0].petId).toBe(testPet.id);
      });
  
      it('should handle different weight units correctly', async () => {
        const { primary, testPet } = await setupUserAndPet();
  
        await WeightEntriesService.createWeightEntry(testPet.id, primary.id, makeWeightEntryData({
          weight: '5.50',
          weightUnit: 'kg',
          date: '2024-01-15',
        }));
  
        await WeightEntriesService.createWeightEntry(testPet.id, primary.id, makeWeightEntryData({
          weight: '12.25',
          weightUnit: 'lbs',
          date: '2024-01-16',
        }));
  
        const result = await WeightEntriesService.getWeightEntries(testPet.id, primary.id);
  
        expect(result.weightUnit).toBe('lbs');
        expect(result.weightEntries[0].weightUnit).toBe('kg');
        expect(result.weightEntries[1].weightUnit).toBe('lbs');
      });
    });
  
    describe('Edge Cases', () => {
      it('should enforce realistic weight limits based on animal type', async () => {
        const { primary } = await setupUserAndPet();
          
        // Cat range
        const [cat] = await db.insert(schema.pets).values({
          userId: primary.id,
          name: 'Test Cat',
          animalType: 'cat',
          isActive: true,
        }).returning();
          
        // Dog range
        const [dog] = await db.insert(schema.pets).values({
          userId: primary.id,
          name: 'Test Dog', 
          animalType: 'dog',
          isActive: true,
        }).returning();
        
        // Valid weights should work
        await expect(
          WeightEntriesService.createWeightEntry(cat.id, primary.id, makeWeightEntryData({ weight: '4.5' }))
        ).resolves.toBeDefined();
          
        await expect(
          WeightEntriesService.createWeightEntry(dog.id, primary.id, makeWeightEntryData({ weight: '25.0' }))
        ).resolves.toBeDefined();
        
        // Unrealistic weights should fail
        await expect(
          WeightEntriesService.createWeightEntry(cat.id, primary.id, makeWeightEntryData({ weight: '50.0', date: '2024-01-16' }))
        ).rejects.toThrow('Weight 50kg is outside realistic range for cat');
          
        await expect(
          WeightEntriesService.createWeightEntry(dog.id, primary.id, makeWeightEntryData({ weight: '150.0', date: '2024-01-16' }))
        ).rejects.toThrow('Weight 150kg is outside realistic range for dog');
      });
  
      it('should prevent duplicate entries for same date', async () => {
        const { primary, testPet } = await setupUserAndPet();
          
        const firstEntry = makeWeightEntryData({ weight: '5.50' });
        const duplicateEntry = makeWeightEntryData({ weight: '5.75' }); // Same date
          
        await WeightEntriesService.createWeightEntry(testPet.id, primary.id, firstEntry);
          
        await expect(
          WeightEntriesService.createWeightEntry(testPet.id, primary.id, duplicateEntry)
        ).rejects.toThrow('Weight entry already exists for 2024-01-15. Use update to modify existing entry.');
      });
  
      it('should validate weight limits correctly for lbs pets', async () => {
        const { primary, testPet: lbsPet } = await setupUserAndPet();
        
        // Update pet to be a cat for this test
        await db.update(schema.pets)
          .set({ animalType: 'cat' })
          .where(eq(schema.pets.id, lbsPet.id));
      
        // 35 lbs is about 16kg exceeds cat limit of 15kg
        await expect(
          WeightEntriesService.createWeightEntry(
            lbsPet.id, 
            primary.id, 
            makeWeightEntryData({ weight: '35', weightUnit: 'lbs' })
          )
        ).rejects.toThrow('Weight 35lbs is outside realistic range for cat');
      });
    });
  
    describe('UUID Validation', () => {
      it('should throw BadRequestError for invalid weightId format', async () => {
        const { primary, testPet } = await setupUserAndPet();
  
        // Test all methods that take weightId
        await expect(
          WeightEntriesService.getWeightEntryById(testPet.id, 'invalid-id', primary.id)
        ).rejects.toThrow('Invalid weight entry ID format');
  
        await expect(
          WeightEntriesService.updateWeightEntry(
            testPet.id, 
            'invalid-id', 
            primary.id, 
            { weight: '6.00' }
          )
        ).rejects.toThrow('Invalid weight entry ID format');
  
        await expect(
          WeightEntriesService.deleteWeightEntry(testPet.id, 'invalid-id', primary.id)
        ).rejects.toThrow('Invalid weight entry ID format');
      });
  
      it('should work with valid UUID format', async () => {
        const { primary, testPet } = await setupUserAndPet();
        
        const created = await WeightEntriesService.createWeightEntry(
          testPet.id, 
          primary.id, 
          makeWeightEntryData()
        );
  
        // Should not throw validation errors (will throw NotFoundError for non-existent, but not format error)
        const validUUID = randomUUID();
        await expect(
          WeightEntriesService.getWeightEntryById(testPet.id, validUUID, primary.id)
        ).rejects.toThrow('Weight entry not found'); // Not a format error
  
        // Should work with existing entry
        const result = await WeightEntriesService.getWeightEntryById(testPet.id, created.id, primary.id);
        expect(result.id).toBe(created.id);
      });
    });
  });