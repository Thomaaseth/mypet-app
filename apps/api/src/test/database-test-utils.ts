import { db } from '../db';
import * as schema from '../db/schema';

/**
 * Database test utilities following industry standards
 * - Clean database in correct dependency order
 * - Generate unique test data to prevent conflicts
 * - Reusable setup patterns for all service tests
 */
export class DatabaseTestUtils {
  /**
   * Clean all tables in correct dependency order
   * Called by setupFiles to ensure clean state before each test
   */
  static async cleanDatabase(): Promise<void> {
    try {
      // Clean in dependency order (children first, parents last)
      await db.delete(schema.petVeterinarians);
      await db.delete(schema.foodEntries);
      await db.delete(schema.weightEntries);
      await db.delete(schema.weightTargets);
      await db.delete(schema.veterinarians);
      await db.delete(schema.pets);
      await db.delete(schema.user);
    } catch (error) {
      console.error('Error cleaning test database:', error);
      throw error;
    }
  }

  /**
   * Generate unique test data for each test run
   * Prevents conflicts when tests run concurrently (though we'll run sequentially)
   */
  static generateTestData(): TestData {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const uniqueSuffix = `${timestamp}-${random}`;

    return {
      primaryUserId: `test-user-${uniqueSuffix}`,
      secondaryUserId: `other-user-${uniqueSuffix}`,
      primaryUserEmail: `test-${uniqueSuffix}@example.com`,
      secondaryUserEmail: `other-${uniqueSuffix}@example.com`,
      primaryUserName: 'Primary Test User',
      secondaryUserName: 'Secondary Test User',
    };
  }

  /**
   * Create standard test users
   * Returns the created user data for use in tests
   */
  static async createTestUsers(testData?: TestData): Promise<TestUsers> {
    const data = testData || this.generateTestData();
    
    const users = await db.insert(schema.user).values([
      {
        id: data.primaryUserId,
        name: data.primaryUserName,
        email: data.primaryUserEmail,
      },
      {
        id: data.secondaryUserId,
        name: data.secondaryUserName,
        email: data.secondaryUserEmail,
      },
    ]).returning();

    return {
      primary: users[0],
      secondary: users[1],
      data,
    };
  }

  /**
   * Create test pets for a user
   * Returns created pets for use in tests
   */
  static async createTestPets(
    userId: string,
    petCount: number = 2
  ): Promise<Array<typeof schema.pets.$inferSelect>> {
    const petsData = Array.from({ length: petCount }, (_, index) => ({
      userId,
      name: `Test Pet ${index + 1}`,
      animalType: index % 2 === 0 ? ('cat' as const) : ('dog' as const),
      species: index % 2 === 0 ? 'Persian' : 'Golden Retriever',
      isActive: true,
    }));

    return await db.insert(schema.pets).values(petsData).returning();
  }

  /**
   * Create test weight entries for a pet
   */
  static async createTestWeightEntries(
    petId: string,
    count: number = 2,
    weightUnit: 'kg' | 'lbs' = 'kg'
  ): Promise<Array<typeof schema.weightEntries.$inferSelect>> {
    const baseDate = new Date('2024-01-15');
    const entriesData = Array.from({ length: count }, (_, index) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + index * 5); // 5 days apart
      
      return {
        petId,
        weight: (5.0 + index * 0.25).toFixed(2), // 5.00, 5.25, 5.50...,
        weightUnit,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      };
    });

    return await db.insert(schema.weightEntries).values(entriesData).returning();
  }

  /**
   * Create test food entries for a pet
   */
  static async createTestFoodEntries(
    petId: string,
    foodType: 'dry' | 'wet' = 'dry',
    count: number = 1
  ): Promise<Array<typeof schema.foodEntries.$inferSelect>> {
    const baseDate = new Date('2024-01-10');
    const entriesData = Array.from({ length: count }, (_, index) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + index * 10); // 10 days apart
      
      if (foodType === 'dry') {
        return {
          petId,
          foodType: 'dry' as const,
          brandName: `Test Brand ${index + 1}`,
          productName: `Test Dry Food ${index + 1}`,
          dailyAmount: '120.00', // grams
          dateStarted: date.toISOString().split('T')[0],
          bagWeight: '2.00', // kg
          bagWeightUnit: 'kg' as const,
          dryDailyAmountUnit: 'grams' as const,
          // Wet food fields are null for dry food
          numberOfUnits: null,
          weightPerUnit: null,
          wetWeightUnit: null,
          wetDailyAmountUnit: null,
        };
      } else {
        return {
          petId,
          foodType: 'wet' as const,
          brandName: `Test Brand ${index + 1}`,
          productName: `Test Wet Food ${index + 1}`,
          dailyAmount: '85.00', // grams
          dateStarted: date.toISOString().split('T')[0],
          numberOfUnits: 12,
          weightPerUnit: '85.00', // grams per can
          wetWeightUnit: 'grams' as const,
          wetDailyAmountUnit: 'grams' as const,
          // Dry food fields are null for wet food
          bagWeight: null,
          bagWeightUnit: null,
          dryDailyAmountUnit: null,
        };
      }
    });

    return await db.insert(schema.foodEntries).values(entriesData).returning();
  }
}

// Type definitions for better TypeScript support
export interface TestData {
  primaryUserId: string;
  secondaryUserId: string;
  primaryUserEmail: string;
  secondaryUserEmail: string;
  primaryUserName: string;
  secondaryUserName: string;
}

export interface TestUsers {
  primary: typeof schema.user.$inferSelect;
  secondary: typeof schema.user.$inferSelect;
  data: TestData;
}