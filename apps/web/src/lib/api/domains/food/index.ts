import { FoodService } from './service';
import { foodRepository } from './repository';
import { foodValidator } from './validator';
import type { DryFoodFormData, WetFoodFormData } from '@/types/food';

const foodService = new FoodService(foodRepository, foodValidator);

// API exports
export const dryFoodApi = {
  getDryFoodEntries: (petId: string) => foodService.getDryFoodEntries(petId),
  getFinishedDryFoodEntries: (petId: string, limit?: number) => foodService.getFinishedDryFoodEntries(petId, limit),
  createDryFoodEntry: (petId: string, foodData: DryFoodFormData) => 
    foodService.createDryFoodEntry(petId, foodData),
  updateDryFoodEntry: (petId: string, foodId: string, foodData: Partial<DryFoodFormData>) => 
    foodService.updateDryFoodEntry(petId, foodId, foodData),
};

export const wetFoodApi = {
  getWetFoodEntries: (petId: string) => foodService.getWetFoodEntries(petId),
  getFinishedWetFoodEntries: (petId: string, limit?: number) => foodService.getFinishedWetFoodEntries(petId, limit),
  createWetFoodEntry: (petId: string, foodData: WetFoodFormData) => 
    foodService.createWetFoodEntry(petId, foodData),
  updateWetFoodEntry: (petId: string, foodId: string, foodData: Partial<WetFoodFormData>) => 
    foodService.updateWetFoodEntry(petId, foodId, foodData),
};

export const foodApi = {
  getAllFoodEntries: (petId: string) => foodService.getAllFoodEntries(petId),
  deleteFoodEntry: (petId: string, foodId: string) => foodService.deleteFoodEntry(petId, foodId),
  markFoodAsFinished: (petId: string, foodId: string) => foodService.markFoodAsFinished(petId, foodId),
  updateFinishDate: (petId: string, foodId: string, dateFinished: string) => foodRepository.updateFinishDate(petId, foodId, dateFinished),
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
  AllFoodEntriesApiResponse,
  FoodError,
  FoodEntriesApiResponse
} from './types';

export { FoodRepository } from './repository';
export { FoodValidator } from './validator';
export { FoodService } from './service';