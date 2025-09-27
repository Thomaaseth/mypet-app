import { FoodService } from './service';
import { foodRepository } from './repository';
import { foodValidator } from './validator';
import type { DryFoodFormData, WetFoodFormData } from '@/types/food';

const foodService = new FoodService(foodRepository, foodValidator);

// API exports
export const dryFoodApi = {
  getDryFoodEntries: (petId: string) => foodService.getDryFoodEntries(petId),
  createDryFoodEntry: (petId: string, foodData: DryFoodFormData) => 
    foodService.createDryFoodEntry(petId, foodData),
  updateDryFoodEntry: (petId: string, foodId: string, foodData: Partial<DryFoodFormData>) => 
    foodService.updateDryFoodEntry(petId, foodId, foodData),
};

export const wetFoodApi = {
  getWetFoodEntries: (petId: string) => foodService.getWetFoodEntries(petId),
  createWetFoodEntry: (petId: string, foodData: WetFoodFormData) => 
    foodService.createWetFoodEntry(petId, foodData),
  updateWetFoodEntry: (petId: string, foodId: string, foodData: Partial<WetFoodFormData>) => 
    foodService.updateWetFoodEntry(petId, foodId, foodData),
};

export const foodApi = {
  getAllFoodEntries: (petId: string) => foodService.getAllFoodEntries(petId),
  deleteFoodEntry: (petId: string, foodId: string) => foodService.deleteFoodEntry(petId, foodId),
  markFoodAsFinished: (petId: string, foodId: string) => foodService.markFoodAsFinished(petId, foodId),
};

// Export error handler
export const foodErrorHandler = (error: unknown) => foodService.mapError(error);

// Export types for consumers
export type { 
  DryFoodEntry, 
  WetFoodEntry, 
  DryFoodFormData, 
  WetFoodFormData,
  DryFoodEntriesApiResponse,
  WetFoodEntriesApiResponse,
  AllFoodEntriesApiResponse
} from '@/types/food';

export { FoodRepository } from './repository';
export { FoodValidator } from './validator';
export { FoodService } from './service';