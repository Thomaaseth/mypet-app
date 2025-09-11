// import { describe, it, expect, beforeEach } from 'vitest';
// import { randomUUID } from 'crypto';
// import { eq } from 'drizzle-orm';
// import * as schema from '../../db/schema';
// import type { WeightEntryFormData } from '../../db/schema/weight-entries';
// import { BadRequestError, NotFoundError } from '../../middleware/errors';
// import { WeightEntriesService } from '../weight-entries.service';
// import { db } from '../../db';

// describe('WeightEntriesService', () => {
//   let testUserId: string;
//   let testPetId: string;
//   let otherUserId: string;
//   let otherUserPetId: string;

//   beforeEach(async () => {
//     // Clean database before each test
//     await db.delete(schema.weightEntries);
//     await db.delete(schema.pets);
//     await db.delete(schema.user);

//     // Insert test users
//     testUserId = 'weight-test-user-456';
//     otherUserId = 'other-test-user-789';

//     await db.insert(schema.user).values([
//       {
//         id: testUserId,
//         name: 'Test User',
//         email: 'test@example.com',
//       },
//       {
//         id: otherUserId,
//         name: 'Other User',
//         email: 'other@example.com',
//       },
//     ]);

//     // Insert test pets
//     const [testPet] = await db.insert(schema.pets).values({
//       userId: testUserId,
//       name: 'Test Pet',
//       animalType: 'cat',
//       weightUnit: 'kg',
//     }).returning();
//     testPetId = testPet.id;

//     const [otherPet] = await db.insert(schema.pets).values({
//       userId: otherUserId,
//       name: 'Other User Pet',
//       animalType: 'dog',
//       weightUnit: 'lbs',
//     }).returning();
//     otherUserPetId = otherPet.id;
//   });

//   describe('getWeightEntries', () => {
//     it('should return all weight entries for a pet with correct weight unit', async () => {
//       // Arrange
//       await db.insert(schema.weightEntries).values([
//         {
//           petId: testPetId,
//           weight: '5.50',
//           date: '2024-01-15',
//         },
//         {
//           petId: testPetId,
//           weight: '5.75',
//           date: '2024-01-20',
//         },
//       ]);

//       // Act
//       const result = await WeightEntriesService.getWeightEntries(testPetId, testUserId);

//       // Assert
//       expect(result.weightEntries).toHaveLength(2);
//       expect(result.weightUnit).toBe('kg');
//       expect(result.weightEntries[0].date).toBe('2024-01-15'); // Oldest first
//       expect(result.weightEntries[1].date).toBe('2024-01-20');
//     });

//     it('should return empty array when pet has no weight entries', async () => {
//       const result = await WeightEntriesService.getWeightEntries(testPetId, testUserId);

//       expect(result.weightEntries).toEqual([]);
//       expect(result.weightUnit).toBe('kg');
//     });

//     it('should throw NotFoundError when pet belongs to different user', async () => {
//       await expect(
//         WeightEntriesService.getWeightEntries(otherUserPetId, testUserId)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('getWeightEntryById', () => {
//     let weightEntryId: string;

//     beforeEach(async () => {
//       const [entry] = await db.insert(schema.weightEntries).values({
//         petId: testPetId,
//         weight: '5.50',
//         date: '2024-01-15',
//       }).returning();
//       weightEntryId = entry.id;
//     });

//     it('should return specific weight entry when found', async () => {
//       const result = await WeightEntriesService.getWeightEntryById(testPetId, weightEntryId, testUserId);

//       expect(result.id).toBe(weightEntryId);
//       expect(result.petId).toBe(testPetId);
//       expect(result.weight).toBe('5.50');
//       expect(result.date).toBe('2024-01-15');
//     });

//     it('should throw NotFoundError when weight entry does not exist', async () => {
//       const nonExistentId = randomUUID();

//       await expect(
//         WeightEntriesService.getWeightEntryById(testPetId, nonExistentId, testUserId)
//       ).rejects.toThrow(NotFoundError);
//     });

//     it('should throw NotFoundError when pet belongs to different user', async () => {
//       await expect(
//         WeightEntriesService.getWeightEntryById(otherUserPetId, weightEntryId, testUserId)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('createWeightEntry', () => {
//     it('should create weight entry with valid data', async () => {
//       // Arrange
//       const entryData: WeightEntryFormData = {
//         weight: '5.50',
//         date: '2024-01-15',
//       };

//       // Act
//       const result = await WeightEntriesService.createWeightEntry(testPetId, testUserId, entryData);

//       // Assert
//       expect(result.petId).toBe(testPetId);
//       expect(result.weight).toBe('5.50');
//       expect(result.date).toBe('2024-01-15');
//       expect(result.id).toBeDefined();

//       // Verify it was saved to database
//       const savedEntries = await db.select().from(schema.weightEntries);
//       expect(savedEntries).toHaveLength(1);
//     });

//     it('should throw BadRequestError when required fields are missing', async () => {
//       const missingWeight = { date: '2024-01-15' } as WeightEntryFormData;
//       const missingDate = { weight: '5.50' } as WeightEntryFormData;

//       await expect(
//         WeightEntriesService.createWeightEntry(testPetId, testUserId, missingWeight)
//       ).rejects.toThrow(BadRequestError);

//       await expect(
//         WeightEntriesService.createWeightEntry(testPetId, testUserId, missingDate)
//       ).rejects.toThrow(BadRequestError);
//     });

//     it('should throw BadRequestError when weight is invalid', async () => {
//       const invalidWeights = [
//         { weight: 'not-a-number', date: '2024-01-15' },
//         { weight: '0', date: '2024-01-15' },
//         { weight: '-5.50', date: '2024-01-15' },
//         { weight: '', date: '2024-01-15' },
//       ];

//       for (const invalidData of invalidWeights) {
//         await expect(
//           WeightEntriesService.createWeightEntry(testPetId, testUserId, invalidData as WeightEntryFormData)
//         ).rejects.toThrow(BadRequestError);
//       }
//     });

//     it('should throw BadRequestError when date is in the future', async () => {
//       const tomorrow = new Date();
//       tomorrow.setDate(tomorrow.getDate() + 1);
//       const futureDate = tomorrow.toISOString().split('T')[0];

//       const entryData: WeightEntryFormData = {
//         weight: '5.50',
//         date: futureDate,
//       };

//       await expect(
//         WeightEntriesService.createWeightEntry(testPetId, testUserId, entryData)
//       ).rejects.toThrow(BadRequestError);
//       await expect(
//         WeightEntriesService.createWeightEntry(testPetId, testUserId, entryData)
//       ).rejects.toThrow('Date cannot be in the future');
//     });

//     it('should accept today as valid date', async () => {
//       const today = new Date().toISOString().split('T')[0];
//       const entryData: WeightEntryFormData = {
//         weight: '5.50',
//         date: today,
//       };

//       const result = await WeightEntriesService.createWeightEntry(testPetId, testUserId, entryData);
//       expect(result.date).toBe(today);
//     });

//     it('should throw NotFoundError when pet belongs to different user', async () => {
//       const entryData: WeightEntryFormData = {
//         weight: '5.50',
//         date: '2024-01-15',
//       };

//       await expect(
//         WeightEntriesService.createWeightEntry(otherUserPetId, testUserId, entryData)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('updateWeightEntry', () => {
//     let weightEntryId: string;

//     beforeEach(async () => {
//       const [entry] = await db.insert(schema.weightEntries).values({
//         petId: testPetId,
//         weight: '5.50',
//         date: '2024-01-15',
//       }).returning();
//       weightEntryId = entry.id;
//     });

//     it('should update weight entry with valid data', async () => {
//       const updateData = {
//         weight: '6.00',
//         date: '2024-01-20',
//       };

//       const result = await WeightEntriesService.updateWeightEntry(testPetId, weightEntryId, testUserId, updateData);

//       expect(result.weight).toBe('6.00');
//       expect(result.date).toBe('2024-01-20');
//     });

//     it('should update only provided fields', async () => {
//       const updateData = { weight: '6.25' };

//       const result = await WeightEntriesService.updateWeightEntry(testPetId, weightEntryId, testUserId, updateData);

//       expect(result.weight).toBe('6.25');
//       expect(result.date).toBe('2024-01-15'); // Original date unchanged
//     });

//     it('should throw BadRequestError when weight is invalid', async () => {
//       const invalidUpdates = [
//         { weight: 'invalid' },
//         { weight: '0' },
//         { weight: '-1.5' },
//       ];

//       for (const updateData of invalidUpdates) {
//         await expect(
//           WeightEntriesService.updateWeightEntry(testPetId, weightEntryId, testUserId, updateData)
//         ).rejects.toThrow(BadRequestError);
//       }
//     });

//     it('should throw NotFoundError when weight entry does not exist', async () => {
//       const nonExistentId = randomUUID();
//       const updateData = { weight: '6.00' };

//       await expect(
//         WeightEntriesService.updateWeightEntry(testPetId, nonExistentId, testUserId, updateData)
//       ).rejects.toThrow(NotFoundError);
//     });

//     it('should throw NotFoundError when pet belongs to different user', async () => {
//       const updateData = { weight: '6.00' };

//       await expect(
//         WeightEntriesService.updateWeightEntry(otherUserPetId, weightEntryId, testUserId, updateData)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('deleteWeightEntry', () => {
//     let weightEntryId: string;

//     beforeEach(async () => {
//       const [entry] = await db.insert(schema.weightEntries).values({
//         petId: testPetId,
//         weight: '5.50',
//         date: '2024-01-15',
//       }).returning();
//       weightEntryId = entry.id;
//     });

//     it('should delete weight entry successfully', async () => {
//       await WeightEntriesService.deleteWeightEntry(testPetId, weightEntryId, testUserId);

//       const deletedEntries = await db.select()
//         .from(schema.weightEntries)
//         .where(eq(schema.weightEntries.id, weightEntryId));

//       expect(deletedEntries).toHaveLength(0);
//     });

//     it('should not affect other weight entries', async () => {
//       // Arrange - Create another entry
//       const [otherEntry] = await db.insert(schema.weightEntries).values({
//         petId: testPetId,
//         weight: '6.00',
//         date: '2024-01-20',
//       }).returning();

//       // Act - Delete first entry
//       await WeightEntriesService.deleteWeightEntry(testPetId, weightEntryId, testUserId);

//       // Assert - Other entry should still exist
//       const remainingEntries = await db.select().from(schema.weightEntries);
//       expect(remainingEntries).toHaveLength(1);
//       expect(remainingEntries[0].id).toBe(otherEntry.id);
//     });

//     it('should throw NotFoundError when weight entry does not exist', async () => {
//       const nonExistentId = randomUUID();

//       await expect(
//         WeightEntriesService.deleteWeightEntry(testPetId, nonExistentId, testUserId)
//       ).rejects.toThrow(NotFoundError);
//     });

//     it('should throw NotFoundError when pet belongs to different user', async () => {
//       await expect(
//         WeightEntriesService.deleteWeightEntry(otherUserPetId, weightEntryId, testUserId)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('Security and Authorization', () => {
//     it('should prevent unauthorized access across all operations', async () => {
//       const entryData: WeightEntryFormData = { weight: '6.00', date: '2024-01-15' };

//       // All operations should fail for different user's pet
//       await expect(WeightEntriesService.getWeightEntries(otherUserPetId, testUserId)).rejects.toThrow(NotFoundError);
//       await expect(WeightEntriesService.createWeightEntry(otherUserPetId, testUserId, entryData)).rejects.toThrow(NotFoundError);
//     });

//     it('should prevent access to inactive pets', async () => {
//       // Make pet inactive
//       await db.update(schema.pets)
//         .set({ isActive: false })
//         .where(eq(schema.pets.id, testPetId));

//       const entryData: WeightEntryFormData = { weight: '6.00', date: '2024-01-15' };

//       await expect(WeightEntriesService.getWeightEntries(testPetId, testUserId)).rejects.toThrow(NotFoundError);
//       await expect(WeightEntriesService.createWeightEntry(testPetId, testUserId, entryData)).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('Data Integrity', () => {
//     it('should maintain referential integrity with pets table', async () => {
//       const entryData: WeightEntryFormData = {
//         weight: '5.50',
//         date: '2024-01-15',
//       };

//       const result = await WeightEntriesService.createWeightEntry(testPetId, testUserId, entryData);

//       const entry = await db.select()
//         .from(schema.weightEntries)
//         .where(eq(schema.weightEntries.id, result.id));

//       expect(entry[0].petId).toBe(testPetId);
//     });

//     it('should handle different weight units correctly', async () => {
//       // Create pets with different weight units
//       const [kgPet] = await db.insert(schema.pets).values({
//         userId: testUserId,
//         name: 'KG Pet',
//         animalType: 'cat',
//         weightUnit: 'kg',
//       }).returning();

//       const [lbsPet] = await db.insert(schema.pets).values({
//         userId: testUserId,
//         name: 'LBS Pet',
//         animalType: 'dog',
//         weightUnit: 'lbs',
//       }).returning();

//       // Create entries for both pets
//       await WeightEntriesService.createWeightEntry(kgPet.id, testUserId, {
//         weight: '5.50',
//         date: '2024-01-15',
//       });

//       await WeightEntriesService.createWeightEntry(lbsPet.id, testUserId, {
//         weight: '12.25',
//         date: '2024-01-15',
//       });

//       // Verify each pet returns correct weight unit
//       const kgResult = await WeightEntriesService.getWeightEntries(kgPet.id, testUserId);
//       const lbsResult = await WeightEntriesService.getWeightEntries(lbsPet.id, testUserId);

//       expect(kgResult.weightUnit).toBe('kg');
//       expect(lbsResult.weightUnit).toBe('lbs');
//     });
//   });

//   describe('Edge Cases', () => {
//     it('should handle very small and large weights', async () => {
//       const smallWeightData: WeightEntryFormData = {
//         weight: '0.01',
//         date: '2024-01-15',
//       };

//       const largeWeightData: WeightEntryFormData = {
//         weight: '999.99',
//         date: '2024-01-16',
//       };

//       const smallResult = await WeightEntriesService.createWeightEntry(testPetId, testUserId, smallWeightData);
//       const largeResult = await WeightEntriesService.createWeightEntry(testPetId, testUserId, largeWeightData);

//       expect(smallResult.weight).toBe('0.01');
//       expect(largeResult.weight).toBe('999.99');
//     });

//     it('should handle duplicate entries for same date', async () => {
//       const firstEntry: WeightEntryFormData = {
//         weight: '5.50',
//         date: '2024-01-15',
//       };

//       const secondEntry: WeightEntryFormData = {
//         weight: '5.75',
//         date: '2024-01-15',
//       };

//       await WeightEntriesService.createWeightEntry(testPetId, testUserId, firstEntry);
//       const result = await WeightEntriesService.createWeightEntry(testPetId, testUserId, secondEntry);

//       expect(result.weight).toBe('5.75');
      
//       const allEntries = await db.select().from(schema.weightEntries);
//       expect(allEntries).toHaveLength(2);
//     });
//   });
// });