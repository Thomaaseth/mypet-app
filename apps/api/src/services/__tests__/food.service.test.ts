// import { describe, it, expect } from 'vitest';
// import { randomUUID } from 'crypto';
// import { eq } from 'drizzle-orm';
// import * as schema from '../../db/schema';
// import { BadRequestError, NotFoundError } from '../../middleware/errors';
// import { FoodService } from '../food.service';
// import { db } from '../../db';
// import { DatabaseTestUtils } from '../../test/database-test-utils';
// import type { DryFoodFormData, WetFoodFormData } from '../food.service';

// describe('FoodService', () => {
//   describe('Dry Food Operations', () => {
//     describe('createDryFoodEntry', () => {
//       it('should create dry food entry with valid data', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const dryFoodData: DryFoodFormData = {
//           brandName: 'Test Brand',
//           productName: 'Test Food',
//           bagWeight: '2.0',
//           bagWeightUnit: 'kg',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         const result = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

//         expect(result.bagWeight).toBe('2.00');
//         expect(result.bagWeightUnit).toBe('kg');
//         expect(result.dailyAmount).toBe('100.00');
//         expect(result.isActive).toBe(true);
//       });

//       it('should throw BadRequestError when required fields are missing', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const invalidData: Partial<DryFoodFormData> = {
//           brandName: 'Test Brand',
//           // Missing required fields
//         };

//         await expect(
//           FoodService.createDryFoodEntry(testPet.id, primary.id, invalidData as DryFoodFormData)
//         ).rejects.toThrow(BadRequestError);
//       });

//       it('should throw BadRequestError for invalid bag weight unit', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const invalidData = {
//           brandName: 'Test Brand',
//           productName: 'Test Food',
//           bagWeight: '2.0',
//           bagWeightUnit: 'invalid_unit',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         await expect(
//           FoodService.createDryFoodEntry(testPet.id, primary.id, invalidData as any)
//         ).rejects.toThrow('Invalid bag weight unit');
//       });

//       it('should throw BadRequestError for future purchase date', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const tomorrow = new Date();
//         tomorrow.setDate(tomorrow.getDate() + 1);
//         const futureDate = tomorrow.toISOString().split('T')[0];
        
//         const invalidData: DryFoodFormData = {
//           brandName: 'Test Brand',
//           productName: 'Test Food',
//           bagWeight: '2.0',
//           bagWeightUnit: 'kg',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: futureDate,
//         };

//         await expect(
//           FoodService.createDryFoodEntry(testPet.id, primary.id, invalidData)
//         ).rejects.toThrow('Purchase date cannot be in the future');
//       });
//     });

//     describe('getDryFoodEntries', () => {
//       it('should return all dry food entries for a pet', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         // Create multiple dry food entries
//         const dryFoodData1: DryFoodFormData = {
//           brandName: 'Brand A',
//           productName: 'Food A',
//           bagWeight: '2.0',
//           bagWeightUnit: 'kg',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         const dryFoodData2: DryFoodFormData = {
//           brandName: 'Brand B',
//           productName: 'Food B',
//           bagWeight: '1.5',
//           bagWeightUnit: 'kg',
//           dailyAmount: '80',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-05',
//         };

//         await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData1);
//         await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData2);

//         const result = await FoodService.getDryFoodEntries(testPet.id, primary.id);

//         expect(result.length).toBe(2);
//         expect(result.some(entry => entry.brandName === 'Brand A')).toBe(true);
//         expect(result.some(entry => entry.brandName === 'Brand B')).toBe(true);
//       });
//     });

//     describe('updateDryFoodEntry', () => {
//       it('should update dry food entry with valid data', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const dryFoodData: DryFoodFormData = {
//           brandName: 'Original Brand',
//           productName: 'Original Food',
//           bagWeight: '2.0',
//           bagWeightUnit: 'kg',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

//         const updateData: Partial<DryFoodFormData> = {
//           brandName: 'Updated Brand',
//           dailyAmount: '120',
//         };

//         const result = await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, updateData);

//         expect(result.brandName).toBe('Updated Brand');
//         expect(result.dailyAmount).toBe('120.00');
//         expect(result.productName).toBe('Original Food'); // Should remain unchanged
//       });
//     });

//     describe('deleteDryFoodEntry', () => {
//       it('should delete dry food entry successfully', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const dryFoodData: DryFoodFormData = {
//           brandName: 'Test Brand',
//           productName: 'Test Food',
//           bagWeight: '2.0',
//           bagWeightUnit: 'kg',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);

//         await FoodService.deleteFoodEntry(testPet.id, created.id, primary.id);

//         // Verify it's deleted from database
//         const deletedEntry = await db.select()
//           .from(schema.foodEntries)
//           .where(eq(schema.foodEntries.id, created.id));

//         expect(deletedEntry).toHaveLength(0);
//       });
//     });
//   });

//   describe('Wet Food Operations', () => {
//     describe('createWetFoodEntry', () => {
//       it('should create wet food entry with valid data', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const wetFoodData: WetFoodFormData = {
//           brandName: 'Wet Brand',
//           productName: 'Wet Food',
//           numberOfUnits: '12',
//           weightPerUnit: '85',
//           wetWeightUnit: 'grams',
//           dailyAmount: '170',
//           wetDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         const result = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);

//         expect(result.numberOfUnits).toBe(12);
//         expect(result.weightPerUnit).toBe('85.00');
//         expect(result.wetWeightUnit).toBe('grams');
//         expect(result.isActive).toBe(true);
//       });

//       it('should throw BadRequestError for invalid number of units', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const invalidData = {
//           brandName: 'Wet Brand',
//           productName: 'Wet Food',
//           numberOfUnits: 'invalid',
//           weightPerUnit: '85',
//           wetWeightUnit: 'grams',
//           dailyAmount: '170',
//           wetDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         await expect(
//           FoodService.createWetFoodEntry(testPet.id, primary.id, invalidData as any)
//         ).rejects.toThrow(BadRequestError);
//       });
//     });

//     describe('getWetFoodEntries', () => {
//       it('should return all wet food entries for a pet', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         const wetFoodData: WetFoodFormData = {
//           brandName: 'Wet Brand',
//           productName: 'Wet Food',
//           numberOfUnits: '12',
//           weightPerUnit: '85',
//           wetWeightUnit: 'grams',
//           dailyAmount: '170',
//           wetDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };

//         await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);

//         const result = await FoodService.getWetFoodEntries(testPet.id, primary.id);

//         expect(result.length).toBe(1);
//         expect(result[0].brandName).toBe('Wet Brand');
//         expect(result[0].foodType).toBe('wet');
//       });
//     });
//   });

//   describe('UUID Validation', () => {
//     it('should throw BadRequestError for invalid foodId format', async () => {
//       const { primary } = await DatabaseTestUtils.createTestUsers();
//       const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);

//       await expect(
//         FoodService.getDryFoodEntryById(testPet.id, 'invalid-food-id', primary.id)
//       ).rejects.toThrow('Invalid food entry ID format');

//       await expect(
//         FoodService.updateDryFoodEntry(testPet.id, 'invalid-food-id', primary.id, { brandName: 'New Brand' })
//       ).rejects.toThrow('Invalid food entry ID format');

//       await expect(
//         FoodService.deleteFoodEntry(testPet.id, 'invalid-food-id', primary.id)
//       ).rejects.toThrow('Invalid food entry ID format');
//     });
//   });

//   describe('Security and Authorization', () => {
//     it('should prevent unauthorized access to food entries', async () => {
//       const { primary, secondary } = await DatabaseTestUtils.createTestUsers();
//       const [otherUserPet] = await DatabaseTestUtils.createTestPets(secondary.id, 1);
      
//       const foodData: DryFoodFormData = {
//         brandName: 'Test Brand',
//         productName: 'Test Food',
//         bagWeight: '2.0',
//         bagWeightUnit: 'kg',
//         dailyAmount: '100',
//         dryDailyAmountUnit: 'grams',
//         datePurchased: '2024-01-01',
//       };

//       await expect(
//         FoodService.createDryFoodEntry(otherUserPet.id, primary.id, foodData)
//       ).rejects.toThrow(NotFoundError);

//       await expect(
//         FoodService.getDryFoodEntries(otherUserPet.id, primary.id)
//       ).rejects.toThrow(NotFoundError);
//     });

//     it('should prevent access to inactive pets', async () => {
//       const { primary } = await DatabaseTestUtils.createTestUsers();
//       const [inactivePet] = await db.insert(schema.pets).values({
//         userId: primary.id,
//         name: 'Inactive Pet',
//         animalType: 'cat',
//         isActive: false,
//       }).returning();

//       const foodData: DryFoodFormData = {
//         brandName: 'Test Brand',
//         productName: 'Test Food',
//         bagWeight: '2.0',
//         bagWeightUnit: 'kg',
//         dailyAmount: '100',
//         dryDailyAmountUnit: 'grams',
//         datePurchased: '2024-01-01',
//       };

//       await expect(
//         FoodService.createDryFoodEntry(inactivePet.id, primary.id, foodData)
//       ).rejects.toThrow(NotFoundError);
//     });
//   });
//   describe('FoodService - Enhanced Tests', () => {
  
//     // =============================================
//     // UPDATE OPERATIONS TESTS
//     // =============================================
//     describe('Update Operations', () => {
//       describe('updateDryFoodEntry', () => {
//         it('should update dry food entry with valid partial data', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             brandName: 'Original Brand',
//             productName: 'Original Product',
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
          
//           const updateData: Partial<DryFoodFormData> = {
//             brandName: 'Updated Brand',
//             dailyAmount: '150',
//           };
  
//           const updated = await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, updateData);
  
//           expect(updated.brandName).toBe('Updated Brand');
//           expect(updated.dailyAmount).toBe('150.00');
//           expect(updated.productName).toBe('Original Product'); // Unchanged
//           expect(updated.bagWeight).toBe('2.00'); // Unchanged
//         });
  
//         it('should handle null/undefined brand and product names', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             brandName: 'Original Brand',
//             productName: 'Original Product',
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
          
//           // Test clearing brand name
//           const updated = await FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { 
//             brandName: '' 
//           });
  
//           expect(updated.brandName).toBe(null);
//         });
  
//         it('should throw BadRequestError when no fields provided for update', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
  
//           await expect(
//             FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, {})
//           ).rejects.toThrow('At least one field must be provided for update');
//         });
  
//         it('should throw NotFoundError when updating non-existent entry', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const nonExistentId = randomUUID();
  
//           await expect(
//             FoodService.updateDryFoodEntry(testPet.id, nonExistentId, primary.id, { brandName: 'Test' })
//           ).rejects.toThrow(NotFoundError);
//         });
//       });
  
//       describe('updateWetFoodEntry', () => {
//         it('should update wet food entry with valid partial data', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const wetFoodData: WetFoodFormData = {
//             brandName: 'Original Wet Brand',
//             productName: 'Original Wet Product',
//             numberOfUnits: '12',
//             weightPerUnit: '85',
//             wetWeightUnit: 'grams',
//             dailyAmount: '170',
//             wetDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);
          
//           const updateData: Partial<WetFoodFormData> = {
//             brandName: 'Updated Wet Brand',
//             numberOfUnits: '24',
//           };
  
//           const updated = await FoodService.updateWetFoodEntry(testPet.id, created.id, primary.id, updateData);
  
//           expect(updated.brandName).toBe('Updated Wet Brand');
//           expect(updated.numberOfUnits).toBe(24);
//           expect(updated.productName).toBe('Original Wet Product'); // Unchanged
//           expect(updated.weightPerUnit).toBe('85.00'); // Unchanged
//         });
  
//         it('should validate partial wet food data correctly', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const wetFoodData: WetFoodFormData = {
//             numberOfUnits: '12',
//             weightPerUnit: '85',
//             wetWeightUnit: 'grams',
//             dailyAmount: '170',
//             wetDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);
  
//           await expect(
//             FoodService.updateWetFoodEntry(testPet.id, created.id, primary.id, { 
//               numberOfUnits: 'invalid' 
//             })
//           ).rejects.toThrow(BadRequestError);
//         });
//       });
  
//       describe('Partial Update Validations', () => {
//         it('should validate numeric fields in partial updates', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
  
//           // Test invalid numeric values
//           await expect(
//             FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { 
//               bagWeight: 'invalid-number' 
//             })
//           ).rejects.toThrow(BadRequestError);
  
//           await expect(
//             FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { 
//               dailyAmount: '-50' 
//             })
//           ).rejects.toThrow(BadRequestError);
//         });
  
//         it('should validate date formats in partial updates', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
  
//           await expect(
//             FoodService.updateDryFoodEntry(testPet.id, created.id, primary.id, { 
//               datePurchased: 'invalid-date' 
//             })
//           ).rejects.toThrow(BadRequestError);
//         });
//       });
//     });
  
//     // =============================================
//     // CALCULATION METHODS TESTS
//     // =============================================
//     describe('Business Logic Calculations', () => {
//       describe('calculateDryFoodRemaining', () => {
//         it('should calculate remaining days correctly for active dry food', async () => {
//           const purchaseDate = new Date();
//           purchaseDate.setDate(purchaseDate.getDate() - 5); // 5 days ago
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '2.00', // 2kg = 2000g
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '100.00', // 100g per day
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: purchaseDate.toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             // Wet food fields (null for dry food)
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // After 5 days at 100g/day, 500g consumed, 1500g remaining
//           // 1500g / 100g per day = 15 days remaining
//           expect(result.remainingDays).toBe(15);
//           expect(result.remainingWeight).toBeCloseTo(1.5, 2); // 1.5kg remaining
//         });
  
//         it('should handle unit conversions correctly for dry food', async () => {
//           const purchaseDate = new Date();
//           purchaseDate.setDate(purchaseDate.getDate() - 2);
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '4.41', // 4.41 pounds = ~2000g
//             bagWeightUnit: 'pounds' as const,
//             dailyAmount: '1.00', // 1 cup = ~120g
//             dryDailyAmountUnit: 'cups' as const,
//             datePurchased: purchaseDate.toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // 2000g - (2 days × 120g) = 1760g remaining
//           // 1760g / 120g per day = 14.67 → 14 days
//           expect(result.remainingDays).toBe(14);
//           expect(result.remainingWeight).toBeCloseTo(3.88, 1); // Back to pounds
//         });
  
//         it('should return 0 remaining days for finished dry food', async () => {
//           const purchaseDate = new Date();
//           purchaseDate.setDate(purchaseDate.getDate() - 30); // 30 days ago
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '2.00', // 2kg
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '100.00', // 100g per day
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: purchaseDate.toISOString().split('T')[0],
//             isActive: false,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // After 30 days at 100g/day, 3000g consumed but only had 2000g
//           expect(result.remainingDays).toBe(0);
//           expect(result.remainingWeight).toBe(0);
//         });
//       });
  
//       describe('calculateWetFoodRemaining', () => {
//         it('should calculate remaining days correctly for active wet food', async () => {
//           const purchaseDate = new Date();
//           purchaseDate.setDate(purchaseDate.getDate() - 3); // 3 days ago
          
//           const wetFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'wet' as const,
//             numberOfUnits: 12,
//             weightPerUnit: '85.00', // 85g per unit
//             wetWeightUnit: 'grams' as const,
//             dailyAmount: '170.00', // 170g per day
//             wetDailyAmountUnit: 'grams' as const,
//             datePurchased: purchaseDate.toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             // Dry food fields (null for wet food)
//             bagWeight: null,
//             bagWeightUnit: null,
//             dryDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);
  
//           // Total: 12 × 85g = 1020g
//           // After 3 days at 170g/day: 510g consumed, 510g remaining
//           // 510g / 170g per day = 3 days remaining
//           expect(result.remainingDays).toBe(3);
//           expect(result.remainingWeight).toBeCloseTo(510, 1);
//         });
  
//         it('should handle unit conversions for wet food (oz to grams)', async () => {
//           const purchaseDate = new Date();
//           purchaseDate.setDate(purchaseDate.getDate() - 1);
          
//           const wetFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'wet' as const,
//             numberOfUnits: 6,
//             weightPerUnit: '3.00', // 3oz per unit
//             wetWeightUnit: 'oz' as const,
//             dailyAmount: '6.00', // 6oz per day
//             wetDailyAmountUnit: 'oz' as const,
//             datePurchased: purchaseDate.toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             bagWeight: null,
//             bagWeightUnit: null,
//             dryDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);
  
//           // Total: 6 × 3oz = 18oz
//           // After 1 day at 6oz/day: 6oz consumed, 12oz remaining
//           // 12oz / 6oz per day = 2 days remaining
//           expect(result.remainingDays).toBe(2);
//           expect(result.remainingWeight).toBeCloseTo(12, 1); // Back to oz
//         });
//       });
  
//       describe('updateFoodActiveStatus', () => {
//         it('should mark dry food as inactive when finished', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           // Create food entry with date far in past to simulate finished food
//           const pastDate = new Date();
//           pastDate.setDate(pastDate.getDate() - 30); // 30 days ago
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '1.0', // Small bag
//             bagWeightUnit: 'kg',
//             dailyAmount: '50', // Will be finished in 20 days
//             dryDailyAmountUnit: 'grams',
//             datePurchased: pastDate.toISOString().split('T')[0],
//           };
  
//           let created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
          
//           // Should still be active initially
//           expect(created.isActive).toBe(true);
          
//           // Process the entry - should trigger inactive status update
//           const processed = await FoodService.processEntryForResponse(created);
          
//           expect(processed.isActive).toBe(false);
          
//           // Verify in database
//           const [dbEntry] = await db.select()
//             .from(schema.foodEntries)
//             .where(eq(schema.foodEntries.id, created.id));
          
//           expect(dbEntry.isActive).toBe(false);
//         });
  
//         it('should keep active food as active', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '5.0', // Large bag
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: new Date().toISOString().split('T')[0], // Today
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
//           const processed = await FoodService.processEntryForResponse(created);
          
//           expect(processed.isActive).toBe(true);
//         });
//       });
  
//       describe('Food Expiry Logic', () => {
//         it('should calculate correct depletion date for active food', async () => {
//           const today = new Date();
//           const purchaseDate = new Date();
//           purchaseDate.setDate(today.getDate() - 5); // 5 days ago
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '3.00', // 3kg = 3000g
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '150.00', // 150g per day
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: purchaseDate.toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // After 5 days: 3000g - 750g = 2250g remaining
//           // 2250g / 150g = 15 days remaining
//           // Depletion date should be today + 15 days
//           const expectedDepletionDate = new Date();
//           expectedDepletionDate.setDate(today.getDate() + 15);
  
//           expect(result.remainingDays).toBe(15);
//           expect(result.depletionDate.toDateString()).toBe(expectedDepletionDate.toDateString());
//         });
  
//         it('should calculate correct depletion date for finished food', async () => {
//           const today = new Date();
//           const purchaseDate = new Date();
//           purchaseDate.setDate(today.getDate() - 25); // 25 days ago
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '2.00', // 2kg = 2000g
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '100.00', // 100g per day
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: purchaseDate.toISOString().split('T')[0],
//             isActive: false,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // Food finished after 20 days (2000g / 100g per day)
//           // Depletion date should be purchase date + 20 days
//           const expectedDepletionDate = new Date(purchaseDate);
//           expectedDepletionDate.setDate(purchaseDate.getDate() + 20);
  
//           expect(result.remainingDays).toBe(0);
//           expect(result.depletionDate.toDateString()).toBe(expectedDepletionDate.toDateString());
//         });
//       });
//     });
  
//     // =============================================
//     // GET ALL FOOD ENTRIES TESTS
//     // =============================================
//     describe('getAllFoodEntries', () => {
//       it('should return both dry and wet food entries', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         // Create dry food entry
//         const dryFoodData: DryFoodFormData = {
//           brandName: 'Dry Brand',
//           bagWeight: '2.0',
//           bagWeightUnit: 'kg',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         };
//         await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
  
//         // Create wet food entry
//         const wetFoodData: WetFoodFormData = {
//           brandName: 'Wet Brand',
//           numberOfUnits: '12',
//           weightPerUnit: '85',
//           wetWeightUnit: 'grams',
//           dailyAmount: '170',
//           wetDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-02',
//         };
//         await FoodService.createWetFoodEntry(testPet.id, primary.id, wetFoodData);
  
//         const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);
  
//         expect(result).toHaveLength(2);
        
//         // Check that we have one of each type
//         const dryEntries = result.filter(entry => entry.foodType === 'dry');
//         const wetEntries = result.filter(entry => entry.foodType === 'wet');
        
//         expect(dryEntries).toHaveLength(1);
//         expect(wetEntries).toHaveLength(1);
        
//         expect(dryEntries[0].brandName).toBe('Dry Brand');
//         expect(wetEntries[0].brandName).toBe('Wet Brand');
//       });
  
//       it('should return entries sorted by creation date (newest first)', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         // Create multiple entries with slight delays to ensure different timestamps
//         const firstEntry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//           brandName: 'First Entry',
//           bagWeight: '2.0',
//           bagWeightUnit: 'kg',
//           dailyAmount: '100',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-01',
//         });
  
//         // Small delay to ensure different timestamps
//         await new Promise(resolve => setTimeout(resolve, 10));
  
//         const secondEntry = await FoodService.createWetFoodEntry(testPet.id, primary.id, {
//           brandName: 'Second Entry',
//           numberOfUnits: '12',
//           weightPerUnit: '85',
//           wetWeightUnit: 'grams',
//           dailyAmount: '170',
//           wetDailyAmountUnit: 'grams',
//           datePurchased: '2024-01-02',
//         });
  
//         const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);
  
//         expect(result).toHaveLength(2);
//         // Should be sorted by creation date, newest first
//         expect(result[0].id).toBe(secondEntry.id);
//         expect(result[1].id).toBe(firstEntry.id);
//       });
  
//       it('should return empty array when no food entries exist', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
  
//         const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);
  
//         expect(result).toEqual([]);
//       });
  
//       it('should include both active and inactive entries', async () => {
//         const { primary } = await DatabaseTestUtils.createTestUsers();
//         const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
        
//         // Create an entry that will be finished
//         const pastDate = new Date();
//         pastDate.setDate(pastDate.getDate() - 30);
        
//         await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//           bagWeight: '0.5', // Small bag, will be finished quickly
//           bagWeightUnit: 'kg',
//           dailyAmount: '50',
//           dryDailyAmountUnit: 'grams',
//           datePurchased: pastDate.toISOString().split('T')[0],
//         });
  
//         // Create an active entry
//         await FoodService.createWetFoodEntry(testPet.id, primary.id, {
//           numberOfUnits: '12',
//           weightPerUnit: '85',
//           wetWeightUnit: 'grams',
//           dailyAmount: '50', // Low consumption to keep it active
//           wetDailyAmountUnit: 'grams',
//           datePurchased: new Date().toISOString().split('T')[0],
//         });
  
//         const result = await FoodService.getAllFoodEntries(testPet.id, primary.id);
  
//         expect(result).toHaveLength(2);
        
//         // Should include both active and inactive
//         const activeEntries = result.filter(entry => entry.isActive);
//         const inactiveEntries = result.filter(entry => !entry.isActive);
        
//         expect(activeEntries).toHaveLength(1);
//         expect(inactiveEntries).toHaveLength(1);
//       });
//     });
  
//     // =============================================
//     // EDGE CASES AND ERROR SCENARIOS
//     // =============================================
//     describe('Edge Cases and Error Scenarios', () => {
      
//       describe('Zero and Negative Values', () => {
//         it('should handle zero daily amount gracefully in calculations', async () => {
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '2.00',
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '0.00', // Zero daily amount
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: new Date().toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           expect(result.remainingDays).toBe(0);
//           expect(result.remainingWeight).toBe(2.0); // Full weight remains
//         });
  
//         it('should prevent negative remaining weight in calculations', async () => {
//           const pastDate = new Date();
//           pastDate.setDate(pastDate.getDate() - 100); // Long time ago
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '1.00', // Small bag
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '100.00', // High consumption
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: pastDate.toISOString().split('T')[0],
//             isActive: false,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // Should never have negative remaining weight
//           expect(result.remainingWeight).toBeGreaterThanOrEqual(0);
//           expect(result.remainingDays).toBe(0);
//         });
  
//         it('should handle very small decimal amounts correctly', async () => {
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '0.01', // Very small bag (10g)
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '1.00', // 1g per day
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: new Date().toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           expect(result.remainingDays).toBe(10); // 10g / 1g per day
//           expect(result.remainingWeight).toBeCloseTo(0.01, 3);
//         });
//       });
  
//       describe('Large Numbers and Precision', () => {
//         it('should handle large bag weights correctly', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//           const largeBagData: DryFoodFormData = {
//             bagWeight: '50.00', // 50kg bag
//             bagWeightUnit: 'kg',
//             dailyAmount: '200',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: new Date().toISOString().split('T')[0], // TODAY, not past date
//           };
          
//           const result = await FoodService.createDryFoodEntry(testPet.id, primary.id, largeBagData);
            
//           // Use the entry directly without processing (which might update active status)
//           const calculations = FoodService.calculateDryFoodRemaining(result);
          
//           expect(calculations.remainingDays).toBe(250); // 50000g / 200g per day
//           expect(calculations.remainingWeight).toBe(50.0);
//         });
  
//         it('should maintain precision with decimal values', async () => {
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '2.55', // Precise decimal
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '123.45', // Precise daily amount
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: new Date().toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // 2550g / 123.45g per day = 20.65... → 20 days
//           expect(result.remainingDays).toBe(20);
//           expect(result.remainingWeight).toBeCloseTo(2.55, 2);
//         });
//       });
  
//       describe('Date Edge Cases', () => {
//         it('should handle same-day purchase correctly', async () => {
//           const today = new Date();
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '2.00',
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '100.00',
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: today.toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // Same day = 0 days consumption, full bag remaining
//           expect(result.remainingDays).toBe(20); // 2000g / 100g per day
//           expect(result.remainingWeight).toBe(2.0);
//         });
  
//         it('should handle future purchase dates gracefully', async () => {
//           const futureDate = new Date();
//           futureDate.setDate(futureDate.getDate() + 5); // 5 days in future
          
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '2.00',
//             bagWeightUnit: 'kg' as const,
//             dailyAmount: '100.00',
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: futureDate.toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // Future date should not result in negative consumption
//           expect(result.remainingWeight).toBe(2.0);
//           expect(result.remainingDays).toBe(20);
//         });
//       });
  
//       describe('Database Constraint Validation', () => {
//         it('should prevent creating dry food with wet food fields', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // The validation should catch missing required fields for dry food
//             const invalidData = {
//               // Missing required dry food fields - only has wet food fields
//               numberOfUnits: '12',
//               weightPerUnit: '85', 
//               wetWeightUnit: 'grams',
//               wetDailyAmountUnit: 'grams',
//               datePurchased: '2024-01-01',
//               // Missing: bagWeight, bagWeightUnit, dailyAmount, dryDailyAmountUnit
//             };
          
//             await expect(
//               FoodService.createDryFoodEntry(testPet.id, primary.id, invalidData as any)
//             ).rejects.toThrow(BadRequestError);
//           });
  
//         it('should prevent creating wet food with dry food fields', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // The validation should catch missing required fields for wet food
//             const invalidData = {
//               // Missing required wet food fields - only has dry food fields
//               bagWeight: '2.0',
//               bagWeightUnit: 'kg',
//               dryDailyAmountUnit: 'grams',
//               datePurchased: '2024-01-01',
//               // Missing: numberOfUnits, weightPerUnit, wetWeightUnit, wetDailyAmountUnit, dailyAmount
//             };
          
//             await expect(
//               FoodService.createWetFoodEntry(testPet.id, primary.id, invalidData as any)
//             ).rejects.toThrow(BadRequestError);
//           });
//       });
  
//       describe('Concurrent Operations', () => {
//         it('should handle concurrent updates to same food entry', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
  
//           // Simulate concurrent updates
//           const update1Promise = FoodService.updateDryFoodEntry(
//             testPet.id, 
//             created.id, 
//             primary.id, 
//             { brandName: 'Brand A' }
//           );
          
//           const update2Promise = FoodService.updateDryFoodEntry(
//             testPet.id, 
//             created.id, 
//             primary.id, 
//             { productName: 'Product B' }
//           );
  
//           // Both should succeed (last one wins for conflicting fields)
//           const results = await Promise.allSettled([update1Promise, update2Promise]);
          
//           expect(results[0].status).toBe('fulfilled');
//           expect(results[1].status).toBe('fulfilled');
//         });
  
//         it('should handle concurrent active status updates', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           // Create finished food entry
//           const pastDate = new Date();
//           pastDate.setDate(pastDate.getDate() - 30);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '1.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: pastDate.toISOString().split('T')[0],
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
  
//           // Trigger multiple concurrent status updates
//           const promises = Array.from({ length: 3 }, () => 
//             FoodService.processEntryForResponse(created)
//           );
  
//           const results = await Promise.all(promises);
          
//           // All should result in inactive status
//           results.forEach(result => {
//             expect(result.isActive).toBe(false);
//           });
//         });
//       });
  
//       describe('Memory and Performance Edge Cases', () => {
//         it('should handle multiple food entries efficiently', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           // Create multiple entries
//           const createPromises = Array.from({ length: 10 }, (_, i) => {
//             const dryFoodData: DryFoodFormData = {
//               brandName: `Brand ${i}`,
//               bagWeight: '2.0',
//               bagWeightUnit: 'kg',
//               dailyAmount: '100',
//               dryDailyAmountUnit: 'grams',
//               datePurchased: '2024-01-01',
//             };
//             return FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
//           });
  
//           await Promise.all(createPromises);
  
//           const startTime = Date.now();
//           const allEntries = await FoodService.getAllFoodEntries(testPet.id, primary.id);
//           const endTime = Date.now();
  
//           expect(allEntries).toHaveLength(10);
//           expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
//         });
//       });
  
//       describe('Data Consistency', () => {
//         it('should maintain data integrity during failed operations', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           const created = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
          
//           // Attempt invalid update
//           try {
//             await FoodService.updateDryFoodEntry(
//               testPet.id, 
//               created.id, 
//               primary.id, 
//               { bagWeight: 'invalid-number' }
//             );
//           } catch (error) {
//             // Expected to fail
//           }
  
//           // Original entry should remain unchanged
//           const unchanged = await FoodService.getDryFoodEntryById(testPet.id, created.id, primary.id);
//           expect(unchanged.bagWeight).toBe('2.00');
//           expect(unchanged.bagWeightUnit).toBe('kg');
//         });
  
//         it('should handle orphaned food entries correctly', async () => {
//           const { primary } = await DatabaseTestUtils.createTestUsers();
//           const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
          
//           const dryFoodData: DryFoodFormData = {
//             bagWeight: '2.0',
//             bagWeightUnit: 'kg',
//             dailyAmount: '100',
//             dryDailyAmountUnit: 'grams',
//             datePurchased: '2024-01-01',
//           };
  
//           await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
          
//           // Deactivate the pet
//           await db.update(schema.pets)
//             .set({ isActive: false })
//             .where(eq(schema.pets.id, testPet.id));
  
//           // Should not be able to access food entries for inactive pet
//           await expect(
//             FoodService.getDryFoodEntries(testPet.id, primary.id)
//           ).rejects.toThrow(NotFoundError);
//         });
//       });

//       describe('Cleanup Mechanism Tests', () => {
//         describe('cleanupFinishedEntries', () => {
//           it('should keep max 5 inactive entries per food type', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // Create 7 finished dry food entries (over the 5 limit)
//             const createPromises = Array.from({ length: 7 }, async (_, i) => {
//               const pastDate = new Date();
//               pastDate.setDate(pastDate.getDate() - (30 + i)); // Different dates
              
//               const dryFoodData: DryFoodFormData = {
//                 brandName: `Finished Brand ${i}`,
//                 bagWeight: '0.5', // Small bag that will be finished
//                 bagWeightUnit: 'kg',
//                 dailyAmount: '100', // Will be finished in 5 days
//                 dryDailyAmountUnit: 'grams',
//                 datePurchased: pastDate.toISOString().split('T')[0],
//               };
              
//               const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, dryFoodData);
              
//               // Process to mark as inactive
//               await FoodService.processEntryForResponse(entry);
              
//               return entry;
//             });
            
//             await Promise.all(createPromises);
            
//             // Check that only 5 inactive entries remain
//             const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
//             const inactiveEntries = allEntries.filter(entry => !entry.isActive);
            
//             expect(inactiveEntries).toHaveLength(5);
//           });
      
//           it('should keep most recently updated inactive entries', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // Create entries with specific order
//             const entries = [];
//             for (let i = 0; i < 7; i++) {
//               const pastDate = new Date();
//               pastDate.setDate(pastDate.getDate() - 30);
              
//               const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//                 brandName: `Entry ${i}`,
//                 bagWeight: '0.5',
//                 bagWeightUnit: 'kg',
//                 dailyAmount: '100',
//                 dryDailyAmountUnit: 'grams',
//                 datePurchased: pastDate.toISOString().split('T')[0],
//               });
              
//               entries.push(entry);
              
//               // Small delay between processing to ensure different updatedAt times
//               await new Promise(resolve => setTimeout(resolve, 10));
//               await FoodService.processEntryForResponse(entry);
//             }
            
//             // Get remaining entries
//             const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
//             const remainingInactive = allEntries.filter(entry => !entry.isActive);
            
//             expect(remainingInactive).toHaveLength(5);
            
//             // Should keep the last 5 processed entries (most recent updatedAt)
//             const remainingBrands = remainingInactive.map(e => e.brandName).sort();
//             expect(remainingBrands).toEqual(['Entry 2', 'Entry 3', 'Entry 4', 'Entry 5', 'Entry 6']);
//           });
      
//           it('should not cleanup when there are 5 or fewer inactive entries', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // Create only 3 finished entries (under the limit)
//             const createPromises = Array.from({ length: 3 }, async (_, i) => {
//               const pastDate = new Date();
//               pastDate.setDate(pastDate.getDate() - 30);
              
//               const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//                 brandName: `Keep Entry ${i}`,
//                 bagWeight: '0.5',
//                 bagWeightUnit: 'kg',
//                 dailyAmount: '100',
//                 dryDailyAmountUnit: 'grams',
//                 datePurchased: pastDate.toISOString().split('T')[0],
//               });
              
//               await FoodService.processEntryForResponse(entry);
//               return entry;
//             });
            
//             await Promise.all(createPromises);
            
//             const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
//             const inactiveEntries = allEntries.filter(entry => !entry.isActive);
            
//             // All 3 should remain
//             expect(inactiveEntries).toHaveLength(3);
//             expect(inactiveEntries.every(e => e.brandName?.startsWith('Keep Entry'))).toBe(true);
//           });
      
//           it('should cleanup dry and wet food independently', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // Create 7 finished dry food entries
//             for (let i = 0; i < 7; i++) {
//               const pastDate = new Date();
//               pastDate.setDate(pastDate.getDate() - 30);
              
//               const dryEntry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//                 brandName: `Dry ${i}`,
//                 bagWeight: '0.5',
//                 bagWeightUnit: 'kg',
//                 dailyAmount: '100',
//                 dryDailyAmountUnit: 'grams',
//                 datePurchased: pastDate.toISOString().split('T')[0],
//               });
              
//               await FoodService.processEntryForResponse(dryEntry);
//             }
            
//             // Create 7 finished wet food entries  
//             for (let i = 0; i < 7; i++) {
//               const pastDate = new Date();
//               pastDate.setDate(pastDate.getDate() - 30);
              
//               const wetEntry = await FoodService.createWetFoodEntry(testPet.id, primary.id, {
//                 brandName: `Wet ${i}`,
//                 numberOfUnits: '2', // Small amount that will be finished
//                 weightPerUnit: '85',
//                 wetWeightUnit: 'grams',
//                 dailyAmount: '170',
//                 wetDailyAmountUnit: 'grams', 
//                 datePurchased: pastDate.toISOString().split('T')[0],
//               });
              
//               await FoodService.processEntryForResponse(wetEntry);
//             }
            
//             // Check dry food cleanup
//             const dryEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
//             const inactiveDryEntries = dryEntries.filter(entry => !entry.isActive);
//             expect(inactiveDryEntries).toHaveLength(5);
            
//             // Check wet food cleanup  
//             const wetEntries = await FoodService.getWetFoodEntries(testPet.id, primary.id);
//             const inactiveWetEntries = wetEntries.filter(entry => !entry.isActive);
//             expect(inactiveWetEntries).toHaveLength(5);
//           });
      
//           it('should handle concurrent cleanup operations safely', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // Create 8 finished entries
//             const entries = [];
//             for (let i = 0; i < 8; i++) {
//               const pastDate = new Date();
//               pastDate.setDate(pastDate.getDate() - 30);
              
//               const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//                 brandName: `Concurrent ${i}`,
//                 bagWeight: '0.5',
//                 bagWeightUnit: 'kg', 
//                 dailyAmount: '100',
//                 dryDailyAmountUnit: 'grams',
//                 datePurchased: pastDate.toISOString().split('T')[0],
//               });
              
//               entries.push(entry);
//             }
            
//             // Process multiple entries concurrently to trigger concurrent cleanups
//             const processPromises = entries.map(entry => 
//               FoodService.processEntryForResponse(entry)
//             );
            
//             await Promise.all(processPromises);
            
//             // Should still only have 5 inactive entries (cleanup should work correctly)
//             const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
//             const inactiveEntries = allEntries.filter(entry => !entry.isActive);
            
//             expect(inactiveEntries).toHaveLength(5);
//           });
      
//           it('should not affect active entries during cleanup', async () => {
//             const { primary } = await DatabaseTestUtils.createTestUsers();
//             const [testPet] = await DatabaseTestUtils.createTestPets(primary.id, 1);
            
//             // Create 2 active entries
//             await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//               brandName: 'Active 1',
//               bagWeight: '5.0', // Large bag to stay active
//               bagWeightUnit: 'kg',
//               dailyAmount: '100',
//               dryDailyAmountUnit: 'grams',
//               datePurchased: new Date().toISOString().split('T')[0],
//             });
            
//             await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//               brandName: 'Active 2',
//               bagWeight: '5.0',
//               bagWeightUnit: 'kg',
//               dailyAmount: '100', 
//               dryDailyAmountUnit: 'grams',
//               datePurchased: new Date().toISOString().split('T')[0],
//             });
            
//             // Create 7 finished entries to trigger cleanup
//             for (let i = 0; i < 7; i++) {
//               const pastDate = new Date();
//               pastDate.setDate(pastDate.getDate() - 30);
              
//               const entry = await FoodService.createDryFoodEntry(testPet.id, primary.id, {
//                 brandName: `Finished ${i}`,
//                 bagWeight: '0.5',
//                 bagWeightUnit: 'kg',
//                 dailyAmount: '100',
//                 dryDailyAmountUnit: 'grams',
//                 datePurchased: pastDate.toISOString().split('T')[0],
//               });
              
//               await FoodService.processEntryForResponse(entry);
//             }
            
//             const allEntries = await FoodService.getDryFoodEntries(testPet.id, primary.id);
//             const activeEntries = allEntries.filter(entry => entry.isActive);
//             const inactiveEntries = allEntries.filter(entry => !entry.isActive);
            
//             // Should have 2 active entries (unaffected) + 5 inactive entries (after cleanup)
//             expect(activeEntries).toHaveLength(2);
//             expect(inactiveEntries).toHaveLength(5);
            
//             const activeBrands = activeEntries.map(e => e.brandName);
//             expect(activeBrands).toEqual(expect.arrayContaining(['Active 1', 'Active 2']));
//           });
//         });
//       });
  
//       describe('Unit Conversion Edge Cases', () => {
//         it('should handle very small unit conversions accurately', async () => {
//           const wetFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'wet' as const,
//             numberOfUnits: 1,
//             weightPerUnit: '0.01', // Very small unit (0.01oz)
//             wetWeightUnit: 'oz' as const,
//             dailyAmount: '0.005', // Very small daily amount
//             wetDailyAmountUnit: 'oz' as const,
//             datePurchased: new Date().toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             bagWeight: null,
//             bagWeightUnit: null,
//             dryDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateWetFoodRemaining(wetFoodEntry);
  
//           // Should handle tiny amounts without precision loss
//           expect(result.remainingDays).toBe(2); // 0.01oz / 0.005oz per day = 2 days
//           expect(result.remainingWeight).toBeCloseTo(0.01, 3);
//         });
  
//         it('should handle mixed unit systems correctly', async () => {
//           // Test pounds bag weight with grams daily amount
//           const dryFoodEntry = {
//             id: randomUUID(),
//             petId: randomUUID(),
//             foodType: 'dry' as const,
//             bagWeight: '1.00', // 1 pound ≈ 453.592g
//             bagWeightUnit: 'pounds' as const,
//             dailyAmount: '50.00', // 50 grams per day
//             dryDailyAmountUnit: 'grams' as const,
//             datePurchased: new Date().toISOString().split('T')[0],
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             brandName: null,
//             productName: null,
//             numberOfUnits: null,
//             weightPerUnit: null,
//             wetWeightUnit: null,
//             wetDailyAmountUnit: null,
//           };
  
//           const result = FoodService.calculateDryFoodRemaining(dryFoodEntry);
  
//           // 453.592g / 50g per day = 9.07 → 9 days
//           expect(result.remainingDays).toBe(9);
//           expect(result.remainingWeight).toBeCloseTo(1.0, 2); // Back to pounds
//         });
//       });
//     });
//   });
// });