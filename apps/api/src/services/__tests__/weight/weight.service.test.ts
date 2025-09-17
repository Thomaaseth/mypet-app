// import { describe, it, expect } from 'vitest';
// import { randomUUID } from 'crypto';
// import { eq } from 'drizzle-orm';
// import * as schema from '../../../db';
// import { BadRequestError, NotFoundError } from '../../../middleware/errors';
// import { WeightEntriesService } from '../../weight-entries.service';
// import { db } from '../../../db';
// import { setupUserAndPet, setupPetWithWeightUnit, setupMultiplePetsWithDifferentUnits } from './helpers/setup';
// import { makeWeightEntryData, makeMultipleWeightEntries, makeInvalidWeightData } from './helpers/factories';

// describe('WeightEntriesService', () => {
//   describe('getWeightEntries', () => {
//     it('should return all weight entries for a pet with correct weight unit', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       await db.insert(schema.weightEntries).values(
//         makeMultipleWeightEntries(testPet.id, 2)
//       );

//       const result = await WeightEntriesService.getWeightEntries(testPet.id, primary.id);

//       expect(result.weightEntries).toHaveLength(2);
//       expect(result.weightUnit).toBe('kg');
//       expect(result.weightEntries[0].date).toBe('2024-01-15');
//       expect(result.weightEntries[1].date).toBe('2024-01-16');
//     });

//     it('should return empty array when pet has no weight entries', async () => {
//       const { primary, testPet } = await setupUserAndPet();

//       const result = await WeightEntriesService.getWeightEntries(testPet.id, primary.id);

//       expect(result.weightEntries).toEqual([]);
//       expect(result.weightUnit).toBe('kg');
//     });

//     it('should throw NotFoundError when pet belongs to different user', async () => {
//       const { primary, secondary } = await setupUserAndPet();
//       const [otherUserPet] = await db.insert(schema.pets).values({
//         userId: secondary.id,
//         name: 'Other User Pet',
//         animalType: 'cat',
//       }).returning();

//       await expect(
//         WeightEntriesService.getWeightEntries(otherUserPet.id, primary.id)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('getWeightEntryById', () => {
//     it('should return specific weight entry when found', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const [entry] = await db.insert(schema.weightEntries).values({
//         ...makeWeightEntryData(),
//         petId: testPet.id,
//       }).returning();

//       const result = await WeightEntriesService.getWeightEntryById(testPet.id, entry.id, primary.id);

//       expect(result.id).toBe(entry.id);
//       expect(result.weight).toBe('5.50');
//       expect(result.date).toBe('2024-01-15');
//     });

//     it('should throw NotFoundError when entry does not exist', async () => {
//       const { primary, testPet } = await setupUserAndPet();
//       const nonExistentId = randomUUID();

//       await expect(
//         WeightEntriesService.getWeightEntryById(testPet.id, nonExistentId, primary.id)
//       ).rejects.toThrow(NotFoundError);
//     });

//     it('should throw NotFoundError when entry belongs to different pet', async () => {
//       const { primary, testPet } = await setupUserAndPet();
//       const [otherPet] = await db.insert(schema.pets).values({
//         userId: primary.id,
//         name: 'Other Pet',
//         animalType: 'dog',
//       }).returning();
      
//       const [entry] = await db.insert(schema.weightEntries).values({
//         ...makeWeightEntryData(),
//         petId: otherPet.id,
//       }).returning();

//       await expect(
//         WeightEntriesService.getWeightEntryById(testPet.id, entry.id, primary.id)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('createWeightEntry', () => {
//     it('should create weight entry with valid data', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const result = await WeightEntriesService.createWeightEntry(
//         testPet.id, 
//         primary.id, 
//         makeWeightEntryData()
//       );

//       expect(result.weight).toBe('5.50');
//       expect(result.date).toBe('2024-01-15');
//       expect(result.petId).toBe(testPet.id);
//     });

//     it('should throw BadRequestError for invalid weight values', async () => {
//       const { primary, testPet } = await setupUserAndPet();

//       await expect(
//         WeightEntriesService.createWeightEntry(
//           testPet.id, 
//           primary.id, 
//           makeWeightEntryData({ weight: 'invalid' })
//         )
//       ).rejects.toThrow(BadRequestError);

//       await expect(
//         WeightEntriesService.createWeightEntry(
//           testPet.id, 
//           primary.id, 
//           makeWeightEntryData({ weight: '-5.0' })
//         )
//       ).rejects.toThrow(BadRequestError);
//     });

//     it('should throw BadRequestError for invalid date formats', async () => {
//       const { primary, testPet } = await setupUserAndPet();

//       await expect(
//         WeightEntriesService.createWeightEntry(
//           testPet.id, 
//           primary.id, 
//           makeWeightEntryData({ date: 'invalid-date' })
//         )
//       ).rejects.toThrow(BadRequestError);

//       await expect(
//         WeightEntriesService.createWeightEntry(
//           testPet.id, 
//           primary.id, 
//           makeWeightEntryData({ date: '2024/01/15' })
//         )
//       ).rejects.toThrow(BadRequestError);
//     });
//   });

//   describe('updateWeightEntry', () => {
//     it('should update weight entry with valid data', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const created = await WeightEntriesService.createWeightEntry(
//         testPet.id, 
//         primary.id, 
//         makeWeightEntryData()
//       );

//       const result = await WeightEntriesService.updateWeightEntry(
//         testPet.id, 
//         created.id, 
//         primary.id, 
//         { weight: '6.25' }
//       );

//       expect(result.weight).toBe('6.25');
//       expect(result.date).toBe('2024-01-15'); // Unchanged
//     });

//     it('should throw BadRequestError when no fields provided for update', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const created = await WeightEntriesService.createWeightEntry(
//         testPet.id, 
//         primary.id, 
//         makeWeightEntryData()
//       );

//       await expect(
//         WeightEntriesService.updateWeightEntry(testPet.id, created.id, primary.id, {})
//       ).rejects.toThrow('At least one field must be provided for update');
//     });

//     it('should throw NotFoundError when updating non-existent entry', async () => {
//       const { primary, testPet } = await setupUserAndPet();
//       const nonExistentId = randomUUID();

//       await expect(
//         WeightEntriesService.updateWeightEntry(
//           testPet.id, 
//           nonExistentId, 
//           primary.id, 
//           { weight: '6.00' }
//         )
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('deleteWeightEntry', () => {
//     it('should delete weight entry successfully', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const created = await WeightEntriesService.createWeightEntry(
//         testPet.id, 
//         primary.id, 
//         makeWeightEntryData()
//       );

//       await WeightEntriesService.deleteWeightEntry(testPet.id, created.id, primary.id);

//       const deletedEntry = await db.select()
//         .from(schema.weightEntries)
//         .where(eq(schema.weightEntries.id, created.id));

//       expect(deletedEntry).toHaveLength(0);
//     });

//     it('should throw NotFoundError when deleting non-existent entry', async () => {
//       const { primary, testPet } = await setupUserAndPet();
//       const nonExistentId = randomUUID();

//       await expect(
//         WeightEntriesService.deleteWeightEntry(testPet.id, nonExistentId, primary.id)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('Security and Authorization', () => {
//     it('should prevent unauthorized access to weight entries', async () => {
//       const { primary, secondary } = await setupUserAndPet();
//       const [otherUserPet] = await db.insert(schema.pets).values({
//         userId: secondary.id,
//         name: 'Other User Pet',
//         animalType: 'cat',
//       }).returning();

//       const entryData = makeWeightEntryData();

//       await expect(
//         WeightEntriesService.getWeightEntries(otherUserPet.id, primary.id)
//       ).rejects.toThrow(NotFoundError);
      
//       await expect(
//         WeightEntriesService.createWeightEntry(otherUserPet.id, primary.id, entryData)
//       ).rejects.toThrow(NotFoundError);
//     });

//     it('should prevent access to inactive pets', async () => {
//       const { primary } = await setupUserAndPet();
//       const [inactivePet] = await db.insert(schema.pets).values({
//         userId: primary.id,
//         name: 'Inactive Pet',
//         animalType: 'cat',
//         isActive: false,
//       }).returning();

//       const entryData = makeWeightEntryData();

//       await expect(
//         WeightEntriesService.getWeightEntries(inactivePet.id, primary.id)
//       ).rejects.toThrow(NotFoundError);
      
//       await expect(
//         WeightEntriesService.createWeightEntry(inactivePet.id, primary.id, entryData)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });

//   describe('Data Integrity', () => {
//     it('should maintain referential integrity with pets table', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const result = await WeightEntriesService.createWeightEntry(
//         testPet.id, 
//         primary.id, 
//         makeWeightEntryData()
//       );

//       const entry = await db.select()
//         .from(schema.weightEntries)
//         .where(eq(schema.weightEntries.id, result.id));

//       expect(entry[0].petId).toBe(testPet.id);
//     });

//     it('should handle different weight units correctly', async () => {
//       const { primary, kgPet, lbsPet } = await setupMultiplePetsWithDifferentUnits();

//       await WeightEntriesService.createWeightEntry(
//         kgPet.id, 
//         primary.id, 
//         makeWeightEntryData({ weight: '5.50' })
//       );

//       await WeightEntriesService.createWeightEntry(
//         lbsPet.id, 
//         primary.id, 
//         makeWeightEntryData({ weight: '12.25' })
//       );

//       const kgResult = await WeightEntriesService.getWeightEntries(kgPet.id, primary.id);
//       const lbsResult = await WeightEntriesService.getWeightEntries(lbsPet.id, primary.id);

//       expect(kgResult.weightUnit).toBe('kg');
//       expect(lbsResult.weightUnit).toBe('lbs');
//     });
//   });

//   describe('Edge Cases', () => {
//     it('should enforce realistic weight limits based on animal type', async () => {
//       const { primary: primaryUser } = await setupUserAndPet();
      
//       // Cat range
//       const [cat] = await db.insert(schema.pets).values({
//         userId: primaryUser.id,
//         name: 'Test Cat',
//         animalType: 'cat',
//       }).returning();
      
//       // Dog range
//       const [dog] = await db.insert(schema.pets).values({
//         userId: primaryUser.id,
//         name: 'Test Dog', 
//         animalType: 'dog',
//       }).returning();
    
//       // Valid weights should work
//       await expect(
//         WeightEntriesService.createWeightEntry(
//           cat.id, 
//           primaryUser.id, 
//           makeWeightEntryData({ weight: '4.5' })
//         )
//       ).resolves.toBeDefined();
      
//       await expect(
//         WeightEntriesService.createWeightEntry(
//           dog.id, 
//           primaryUser.id, 
//           makeWeightEntryData({ weight: '25.0' })
//         )
//       ).resolves.toBeDefined();
    
//       // Unrealistic weights should fail
//       await expect(
//         WeightEntriesService.createWeightEntry(
//           cat.id, 
//           primaryUser.id, 
//           makeWeightEntryData({ weight: '50.0', date: '2024-01-16' })
//         )
//       ).rejects.toThrow('Weight 50kg is outside realistic range for cat');
      
//       await expect(
//         WeightEntriesService.createWeightEntry(
//           dog.id, 
//           primaryUser.id, 
//           makeWeightEntryData({ weight: '150.0', date: '2024-01-16' })
//         )
//       ).rejects.toThrow('Weight 150kg is outside realistic range for dog');
//     });

//     it('should prevent duplicate entries for same date', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const firstEntry = makeWeightEntryData({ weight: '5.50' });
//       const duplicateEntry = makeWeightEntryData({ weight: '5.75' }); // Same date
      
//       await WeightEntriesService.createWeightEntry(testPet.id, primary.id, firstEntry);
      
//       await expect(
//         WeightEntriesService.createWeightEntry(testPet.id, primary.id, duplicateEntry)
//       ).rejects.toThrow('Weight entry already exists for 2024-01-15. Use update to modify existing entry.');
//     });

//     it('should validate weight limits correctly for lbs pets', async () => {
//       const { primary, testPet: lbsPet } = await setupPetWithWeightUnit('lbs');
      
//       // Update pet to be a cat for this test
//       await db.update(schema.pets)
//         .set({ animalType: 'cat' })
//         .where(eq(schema.pets.id, lbsPet.id));
    
//       // 35 lbs is about 16kg exceeds cat limit of 15kg
//       await expect(
//         WeightEntriesService.createWeightEntry(
//           lbsPet.id, 
//           primary.id, 
//           makeWeightEntryData({ weight: '35' })
//         )
//       ).rejects.toThrow('Weight 35lbs is outside realistic range for cat');
//     });
//   });

//   describe('UUID Validation', () => {
//     it('should throw BadRequestError for invalid weightId format', async () => {
//       const { primary, testPet } = await setupUserAndPet();

//       // Test all methods that take weightId
//       await expect(
//         WeightEntriesService.getWeightEntryById(testPet.id, 'invalid-id', primary.id)
//       ).rejects.toThrow('Invalid weight entry ID format');

//       await expect(
//         WeightEntriesService.updateWeightEntry(
//           testPet.id, 
//           'invalid-id', 
//           primary.id, 
//           { weight: '6.00' }
//         )
//       ).rejects.toThrow('Invalid weight entry ID format');

//       await expect(
//         WeightEntriesService.deleteWeightEntry(testPet.id, 'invalid-id', primary.id)
//       ).rejects.toThrow('Invalid weight entry ID format');
//     });

//     it('should work with valid UUID format', async () => {
//       const { primary, testPet } = await setupUserAndPet();
      
//       const [entry] = await db.insert(schema.weightEntries).values({
//         ...makeWeightEntryData(),
//         petId: testPet.id,
//       }).returning();

//       // Should not throw validation errors (will throw NotFoundError for non-existent, but not format error)
//       const validUUID = randomUUID();
//       await expect(
//         WeightEntriesService.getWeightEntryById(testPet.id, validUUID, primary.id)
//       ).rejects.toThrow('Weight entry not found'); // Not a format error

//       // Should work with existing entry
//       const result = await WeightEntriesService.getWeightEntryById(testPet.id, entry.id, primary.id);
//       expect(result.id).toBe(entry.id);
//     });
//   });
// });