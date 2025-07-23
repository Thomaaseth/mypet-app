import { FoodService } from './service';
import { foodRepository } from './repository';
import { foodValidator } from './validator';
import type { FoodFormData, FoodType } from '@/types/food';

const foodService = new FoodService(foodRepository, foodValidator);

// Export the same interface pattern as weightApi and petApi
export const foodApi = {
  getFoodEntries: (petId: string) => foodService.getFoodEntries(petId),
  getFoodEntriesByType: (petId: string, foodType: FoodType) => foodService.getFoodEntriesByType(petId, foodType),
  getFoodEntryById: (petId: string, foodId: string) => foodService.getFoodEntryById(petId, foodId),
  createFoodEntry: (petId: string, foodData: FoodFormData) => 
    foodService.createFoodEntry(petId, foodData),
  updateFoodEntry: (petId: string, foodId: string, foodData: Partial<FoodFormData>) => 
    foodService.updateFoodEntry(petId, foodId, foodData),
  deleteFoodEntry: (petId: string, foodId: string) => foodService.deleteFoodEntry(petId, foodId),
};

// Export the same error handler interface
export const foodErrorHandler = (error: unknown) => foodService.mapError(error);

// Export types for consumers
export type { FoodEntriesApiResponse, FoodError } from './types';

export { FoodRepository } from './repository';
export { FoodValidator } from './validator';
export { FoodService } from './service';