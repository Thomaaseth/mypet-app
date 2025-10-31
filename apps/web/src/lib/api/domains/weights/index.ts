import { WeightService } from './service';
import { weightRepository } from './repository';
import { weightValidator } from './validator';
import type { WeightFormData } from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

// Create configured service instance
const weightService = new WeightService(weightRepository, weightValidator);

// Export the same interface pattern as petApi
export const weightApi = {
  getWeightEntries: (petId: string) => weightService.getWeightEntries(petId),
  getWeightEntryById: (petId: string, weightId: string) => weightService.getWeightEntryById(petId, weightId),
  createWeightEntry: (petId: string, weightData: WeightFormData, animalType: 'cat' | 'dog') => 
    weightService.createWeightEntry(petId, weightData, animalType),
  updateWeightEntry: (petId: string, weightId: string, weightData: Partial<WeightFormData>, animalType: 'cat' | 'dog') => 
    weightService.updateWeightEntry(petId, weightId, weightData, animalType),
  deleteWeightEntry: (petId: string, weightId: string) => weightService.deleteWeightEntry(petId, weightId),
};

// Export the same error handler interface
export const weightErrorHandler = (error: unknown) => weightService.mapError(error);

// Export types for consumers
export type { WeightEntriesApiResponse, WeightError } from './types';

// Export individual components for testing or advanced use
export { WeightRepository } from './repository';
export { WeightValidator } from './validator';
export { WeightService } from './service';