import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

let testDb: ReturnType<typeof drizzle> | null = null;
let testSql: ReturnType<typeof postgres> | null = null;

export async function setupTestDatabase() {
  if (testDb) return testDb;

  // Use test database URL or fallback to test database
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || 
    process.env.DATABASE_URL?.replace('/pettr', '/pettr_test') ||
    'postgresql://localhost:5432/pettr_test';

  console.log('🧪 Connecting to test database:', testDatabaseUrl.replace(/\/\/.*@/, '//***@'));

  // Create PostgreSQL connection for tests
  testSql = postgres(testDatabaseUrl, {
    max: 1, // Single connection for tests
  });

  testDb = drizzle(testSql, { schema });

  return testDb;
}

export async function cleanTestDatabase() {
  if (!testDb) return;

  // Clean in correct order (respecting foreign keys)
  await testDb.delete(schema.weightEntries);
  await testDb.delete(schema.pets);
  await testDb.delete(schema.user);
}

export async function closeTestDatabase() {
  if (testSql) {
    await testSql.end();
    testSql = null;
    testDb = null;
  }
}

// Test data helpers that work with your actual schema
export async function insertTestUser(db: typeof testDb, userData = {}) {
  const defaultUser = {
    id: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: false,
    ...userData,
  };
  
  const [user] = await db!.insert(schema.user).values(defaultUser).returning();
  return user;
}

export async function insertTestPet(db: typeof testDb, petData = {}) {
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
  
  const [pet] = await db!.insert(schema.pets).values(defaultPet).returning();
  return pet;
}