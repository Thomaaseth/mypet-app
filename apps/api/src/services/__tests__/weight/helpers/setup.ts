import { DatabaseTestUtils } from '../../../../test/database-test-utils';
import { db } from '../../../../db';
import * as schema from '../../../../db/schema';

export async function setupUserAndPet() {
  const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
  const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
  return { primary, secondary, testPet };
}

export async function setupPetWithWeightUnit(weightUnit: 'kg' | 'lbs' = 'kg') {
  const { primary } = await DatabaseTestUtils.createTestUsers();
  
  const [testPet] = await db.insert(schema.pets).values({
    userId: primary.id,
    name: `Test Pet (${weightUnit})`,
    animalType: 'cat',
    weightUnit,
  }).returning();

  return { primary, testPet };
}

export async function setupMultiplePetsWithDifferentUnits() {
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

  return { primary, kgPet, lbsPet };
}