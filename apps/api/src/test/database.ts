import { db } from '../db'; // Use the same db connection as production code
import * as schema from '../db/schema';

// Clean database helper using the existing db connection
export async function cleanTestDatabase() {
  // Clean in correct order (respecting foreign keys)
  await db.delete(schema.weightEntries);
  await db.delete(schema.pets);
  await db.delete(schema.user);
}

// Test data helpers
export async function insertTestUser(userData = {}) {
  const defaultUser = {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: false,
    ...userData,
  };
  
  const [user] = await db.insert(schema.user).values(defaultUser).returning();
  return user;
}

export async function insertTestPet(petData = {}) {
  const defaultPet = {
    userId: 'test-user-123',
    name: 'Test Pet',
    animalType: 'cat' as const,
    species: 'Persian',
    gender: 'unknown' as const,
    weightUnit: 'kg' as const,
    isNeutered: false,
    isActive: true,
    ...petData,
  };
  
  const [pet] = await db.insert(schema.pets).values(defaultPet).returning();
  return pet;
}