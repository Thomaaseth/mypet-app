// import { vi } from 'vitest';
// import type { Pet, NewPet } from '../db/schema/pets';

// // Mock data factories for consistent test data
// export const createMockPet = (overrides: Partial<Pet> = {}): Pet => ({
//   id: 'mock-pet-id',
//   name: 'Test Pet',
//   userId: 'mock-user-id',
//   animalType: 'cat',
//   species: 'Persian',
//   gender: 'unknown',
//   birthDate: null,
//   weight: null,
//   weightUnit: 'kg',
//   isNeutered: false,
//   microchipNumber: null,
//   imageUrl: null,
//   notes: null,
//   isActive: true,
//   createdAt: new Date('2024-01-01T00:00:00.000Z'),
//   updatedAt: new Date('2024-01-01T00:00:00.000Z'),
//   ...overrides,
// });

// export const createMockNewPet = (overrides: Partial<NewPet> = {}): NewPet => ({
//   name: 'New Test Pet',
//   userId: 'mock-user-id',
//   animalType: 'dog',
//   species: 'Golden Retriever',
//   gender: 'unknown',
//   weightUnit: 'kg',
//   isNeutered: false,
//   ...overrides,
// });

// // Common test user IDs
// export const TEST_USER_IDS = {
//   VALID: 'test-user-123',
//   INVALID: 'invalid-user-456',
//   ANOTHER: 'another-user-789',
// } as const;

// // Common test pet IDs
// export const TEST_PET_IDS = {
//   VALID: 'test-pet-123',
//   INVALID: 'invalid-pet-456',
//   ANOTHER: 'another-pet-789',
// } as const;

// // Helper to create multiple mock pets
// export const createMockPets = (count: number, userId: string = TEST_USER_IDS.VALID): Pet[] => {
//   return Array.from({ length: count }, (_, index) =>
//     createMockPet({
//       id: `pet-${index + 1}`,
//       name: `Pet ${index + 1}`,
//       userId,
//     })
//   );
// };

// // Common database error scenarios
// export const DB_ERRORS = {
//   CONNECTION_FAILED: new Error('Database connection failed'),
//   CONSTRAINT_VIOLATION: new Error('Constraint violation'),
//   TIMEOUT: new Error('Query timeout'),
// } as const;