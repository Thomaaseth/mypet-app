import { WeightTargetService } from './service';
import { weightTargetRepository } from './repository';
import { weightTargetValidator } from './validator';
import type { WeightTargetFormData } from '@/types/weight-targets';

// Create configured service instance
const weightTargetService = new WeightTargetService(weightTargetRepository, weightTargetValidator);

// Export interface pattern
export const weightTargetApi = {
  getWeightTarget: (petId: string) => weightTargetService.getWeightTarget(petId),
  upsertWeightTarget: (petId: string, targetData: WeightTargetFormData) => 
    weightTargetService.upsertWeightTarget(petId, targetData),
  deleteWeightTarget: (petId: string) => weightTargetService.deleteWeightTarget(petId),
};

// Export error handler interface
export const weightTargetErrorHandler = (error: unknown) => weightTargetService.mapError(error);

// Export types for consumers
export type { WeightTargetApiResponse, WeightTargetError } from './types';

// Export individual components for testing
export { WeightTargetRepository } from './repository';
export { WeightTargetValidator } from './validator';
export { WeightTargetService } from './service';
