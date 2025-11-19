import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WeightTargetsService } from '../../weight-targets.service';
import { db } from '../../../db';
import * as schema from '../../../db/schema'
import { eq } from 'drizzle-orm';
import { BadRequestError, NotFoundError } from '../../../middleware/errors';
import type { WeightTargetFormData } from '../../../db/schema/weight-targets';
import { DatabaseTestUtils } from '../../../test/database-test-utils';

describe('WeightTargetsService', () => {
    let testUserId: string;
    let testPetId: string;
    let otherUserId: string;
    let otherPetId: string;
  
    beforeEach(async () => {
      // Create test users using your existing pattern
      const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
      testUserId = primary.id;
      otherUserId = secondary.id;
  
      // Create test pets (one cat for primary user, one dog for secondary user)
      const [catPet] = await DatabaseTestUtils.createTestPets(testUserId, 1);
      testPetId = catPet.id;
  
      // Update cat to have correct animal type
      await db
        .update(schema.pets)
        .set({ animalType: 'cat' })
        .where(eq(schema.pets.id, testPetId));
  
      // Create dog for other user
      const [dogPet] = await db
        .insert(schema.pets)
        .values({
          userId: otherUserId,
          name: 'Other Dog',
          animalType: 'dog',
          species: 'Labrador',
          gender: 'female',
          birthDate: '2019-01-01',
        })
        .returning();
      otherPetId = dogPet.id;
    });
  
    afterEach(async () => {
      // Cleanup uses your DatabaseTestUtils
      await DatabaseTestUtils.cleanDatabase();
    });
  
    describe('getWeightTarget', () => {
      it('should return target when it exists', async () => {
        // Arrange: Create a target
        const [createdTarget] = await db
          .insert(schema.weightTargets)
          .values({
            petId: testPetId,
            minWeight: '4.0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          })
          .returning();
  
        // Act
        const result = await WeightTargetsService.getWeightTarget(testPetId, testUserId);
  
        // Assert
        expect(result).toBeDefined();
        expect(result?.id).toBe(createdTarget.id);
        expect(result?.petId).toBe(testPetId);
        expect(result?.minWeight).toBe('4.0');
        expect(result?.maxWeight).toBe('6.0');
        expect(result?.weightUnit).toBe('kg');
      });
  
      it('should return null when target does not exist', async () => {
        // Act
        const result = await WeightTargetsService.getWeightTarget(testPetId, testUserId);
  
        // Assert
        expect(result).toBeNull();
      });
  
      it('should throw NotFoundError when pet does not belong to user', async () => {
        // Arrange: Create target for other user's pet
        await db.insert(schema.weightTargets).values({
          petId: otherPetId,
          minWeight: '10.0',
          maxWeight: '15.0',
          weightUnit: 'kg',
        });
  
        // Act & Assert
        await expect(
          WeightTargetsService.getWeightTarget(otherPetId, testUserId)
        ).rejects.toThrow(NotFoundError);
      });
  
      it('should throw NotFoundError when pet does not exist', async () => {
        // Act & Assert
        await expect(
          WeightTargetsService.getWeightTarget('non-existent-pet-id', testUserId)
        ).rejects.toThrow(NotFoundError);
      });
    });
  
    describe('upsertWeightTarget', () => {
      describe('create (first time)', () => {
        it('should create new target with valid kg data', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '4.0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            targetData
          );
  
          // Assert
          expect(result).toBeDefined();
          expect(result.petId).toBe(testPetId);
          expect(result.minWeight).toBe('4.0');
          expect(result.maxWeight).toBe('6.0');
          expect(result.weightUnit).toBe('kg');
          expect(result.createdAt).toBeDefined();
          expect(result.updatedAt).toBeDefined();
  
          // Verify in database
          const [dbTarget] = await db
            .select()
            .from(schema.weightTargets)
            .where(eq(schema.weightTargets.petId, testPetId));
          expect(dbTarget).toBeDefined();
          expect(dbTarget.minWeight).toBe('4.0');
        });
  
        it('should create new target with valid lbs data', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '10.0',
            maxWeight: '15.0',
            weightUnit: 'lbs',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            targetData
          );
  
          // Assert
          expect(result.weightUnit).toBe('lbs');
          expect(result.minWeight).toBe('10.0');
          expect(result.maxWeight).toBe('15.0');
        });
  
        it('should accept decimal values', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '4.25',
            maxWeight: '6.75',
            weightUnit: 'kg',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            targetData
          );
  
          // Assert
          expect(result.minWeight).toBe('4.25');
          expect(result.maxWeight).toBe('6.75');
        });
      });
  
      describe('update (existing target)', () => {
        it('should update existing target', async () => {
          // Arrange: Create initial target
          await db.insert(schema.weightTargets).values({
            petId: testPetId,
            minWeight: '4.0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          });
  
          const updatedData: WeightTargetFormData = {
            minWeight: '4.5',
            maxWeight: '6.5',
            weightUnit: 'kg',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            updatedData
          );
  
          // Assert
          expect(result.minWeight).toBe('4.5');
          expect(result.maxWeight).toBe('6.5');
  
          // Verify only one target exists
          const allTargets = await db
            .select()
            .from(schema.weightTargets)
            .where(eq(schema.weightTargets.petId, testPetId));
          expect(allTargets).toHaveLength(1);
        });
  
        it('should update updatedAt timestamp', async () => {
          // Arrange: Create initial target
          const [initial] = await db
            .insert(schema.weightTargets)
            .values({
              petId: testPetId,
              minWeight: '4.0',
              maxWeight: '6.0',
              weightUnit: 'kg',
            })
            .returning();
  
          // Wait a bit to ensure timestamp difference
          await new Promise((resolve) => setTimeout(resolve, 10));
  
          const updatedData: WeightTargetFormData = {
            minWeight: '4.5',
            maxWeight: '6.5',
            weightUnit: 'kg',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            updatedData
          );
  
          // Assert
          expect(result.updatedAt.getTime()).toBeGreaterThan(initial.updatedAt.getTime());
        });
  
        it('should allow changing weight unit', async () => {
          // Arrange: Create target in kg
          await db.insert(schema.weightTargets).values({
            petId: testPetId,
            minWeight: '4.0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          });
  
          // Update to lbs
          const updatedData: WeightTargetFormData = {
            minWeight: '10.0',
            maxWeight: '15.0',
            weightUnit: 'lbs',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            updatedData
          );
  
          // Assert
          expect(result.weightUnit).toBe('lbs');
          expect(result.minWeight).toBe('10.0');
          expect(result.maxWeight).toBe('15.0');
        });
      });
  
      describe('authorization', () => {
        it('should throw NotFoundError when pet does not belong to user', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '10.0',
            maxWeight: '15.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(otherPetId, testUserId, targetData)
          ).rejects.toThrow(NotFoundError);
        });
  
        it('should throw NotFoundError when pet does not exist', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '4.0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget('non-existent-id', testUserId, targetData)
          ).rejects.toThrow(NotFoundError);
        });
      });
  
      describe('input validation', () => {
        it('should throw BadRequestError when minWeight is undefined', async () => {
          // Arrange
          const targetData = {
            minWeight: undefined,
            maxWeight: '6.0',
            weightUnit: 'kg',
          } as unknown as WeightTargetFormData;
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should throw BadRequestError when maxWeight is undefined', async () => {
          // Arrange
          const targetData = {
            minWeight: '4.0',
            maxWeight: undefined,
            weightUnit: 'kg',
          } as unknown as WeightTargetFormData;
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should throw BadRequestError when weightUnit is missing', async () => {
          // Arrange
          const targetData = {
            minWeight: '4.0',
            maxWeight: '6.0',
            weightUnit: '',
          } as unknown as WeightTargetFormData;
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should throw BadRequestError when min >= max', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '6.0',
            maxWeight: '4.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow('Maximum target weight must be greater than minimum');
        });
  
        it('should throw BadRequestError when min equals max', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '5.0',
            maxWeight: '5.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should throw BadRequestError when minWeight is negative', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '-1.0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow('must be positive');
        });
  
        it('should throw BadRequestError when maxWeight is negative', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '4.0',
            maxWeight: '-6.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should throw BadRequestError when minWeight is zero', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should throw BadRequestError when values are not numeric', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: 'abc',
            maxWeight: '6.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow('must be valid numbers');
        });
      });
  
      describe('business rules validation', () => {
        it('should accept valid weight range for cat in kg', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '3.0',
            maxWeight: '6.0',
            weightUnit: 'kg',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            targetData
          );
  
          // Assert
          expect(result).toBeDefined();
        });
  
        it('should accept valid weight range for cat in lbs', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '8.0',
            maxWeight: '12.0',
            weightUnit: 'lbs',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            testPetId,
            testUserId,
            targetData
          );
  
          // Assert
          expect(result).toBeDefined();
        });
  
        it('should throw BadRequestError when weight too high for cat (kg)', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '10.0',
            maxWeight: '20.0', // Too high for cat (max 15kg)
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow('outside realistic range');
        });
  
        it('should throw BadRequestError when weight too high for cat (lbs)', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '20.0',
            maxWeight: '40.0', // Too high for cat (15kg = ~33 lbs)
            weightUnit: 'lbs',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should throw BadRequestError when weight too low for cat', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '0.01', // Too low (min 0.05kg)
            maxWeight: '4.0',
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(testPetId, testUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
  
        it('should accept valid weight range for dog in kg', async () => {
          // Arrange: Use the other user's dog
          const targetData: WeightTargetFormData = {
            minWeight: '25.0',
            maxWeight: '35.0',
            weightUnit: 'kg',
          };
  
          // Act
          const result = await WeightTargetsService.upsertWeightTarget(
            otherPetId,
            otherUserId,
            targetData
          );
  
          // Assert
          expect(result).toBeDefined();
        });
  
        it('should throw BadRequestError when weight too high for dog', async () => {
          // Arrange
          const targetData: WeightTargetFormData = {
            minWeight: '80.0',
            maxWeight: '100.0', // Too high for dog (max 90kg)
            weightUnit: 'kg',
          };
  
          // Act & Assert
          await expect(
            WeightTargetsService.upsertWeightTarget(otherPetId, otherUserId, targetData)
          ).rejects.toThrow(BadRequestError);
        });
      });
    });
  
    describe('deleteWeightTarget', () => {
      it('should delete existing target', async () => {
        // Arrange: Create target
        await db.insert(schema.weightTargets).values({
          petId: testPetId,
          minWeight: '4.0',
          maxWeight: '6.0',
          weightUnit: 'kg',
        });
  
        // Verify target exists
        const beforeDelete = await db
          .select()
          .from(schema.weightTargets)
          .where(eq(schema.weightTargets.petId, testPetId));
        expect(beforeDelete).toHaveLength(1);
  
        // Act
        await WeightTargetsService.deleteWeightTarget(testPetId, testUserId);
  
        // Assert
        const afterDelete = await db
          .select()
          .from(schema.weightTargets)
          .where(eq(schema.weightTargets.petId, testPetId));
        expect(afterDelete).toHaveLength(0);
      });
  
      it('should throw NotFoundError when target does not exist', async () => {
        // Act & Assert
        await expect(
          WeightTargetsService.deleteWeightTarget(testPetId, testUserId)
        ).rejects.toThrow(NotFoundError);
        await expect(
          WeightTargetsService.deleteWeightTarget(testPetId, testUserId)
        ).rejects.toThrow('Weight target not found');
      });
  
      it('should throw NotFoundError when pet does not belong to user', async () => {
        // Arrange: Create target for other user's pet
        await db.insert(schema.weightTargets).values({
          petId: otherPetId,
          minWeight: '10.0',
          maxWeight: '15.0',
          weightUnit: 'kg',
        });
  
        // Act & Assert
        await expect(
          WeightTargetsService.deleteWeightTarget(otherPetId, testUserId)
        ).rejects.toThrow(NotFoundError);
  
        // Verify target still exists
        const target = await db
          .select()
          .from(schema.weightTargets)
          .where(eq(schema.weightTargets.petId, otherPetId));
        expect(target).toHaveLength(1);
      });
  
      it('should throw NotFoundError when pet does not exist', async () => {
        // Act & Assert
        await expect(
          WeightTargetsService.deleteWeightTarget('non-existent-id', testUserId)
        ).rejects.toThrow(NotFoundError);
      });
    });
  });