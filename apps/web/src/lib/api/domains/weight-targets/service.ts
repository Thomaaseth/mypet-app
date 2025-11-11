import type { WeightTargetApiResponse, WeightTargetError } from './types';
import type { WeightTargetRepository } from './repository';
import type { WeightTargetValidator } from './validator';
import { 
  ApiError, 
  ValidationError, 
  NotFoundError,
  UnauthorizedError,
  ForbiddenError 
} from '../../errors';
import type { WeightTarget, WeightTargetFormData } from '@/types/weight-targets';

export class WeightTargetService {
  constructor(
    private repository: WeightTargetRepository,
    private validator: WeightTargetValidator
  ) {}

  async getWeightTarget(petId: string): Promise<WeightTarget | null> {
    try {
      return await this.repository.getWeightTarget(petId);
    } catch (error) {
      console.error('Error fetching weight target:', error);
      throw error;
    }
  }

  async upsertWeightTarget(
    petId: string, 
    targetData: WeightTargetFormData
  ): Promise<WeightTarget> {
    try {
      // Business validation
      this.validator.validateWeightTargetData(targetData);
      
      // Transform data
      const transformedData = this.validator.transformWeightTargetData(targetData);
      
      return await this.repository.upsertWeightTarget(petId, transformedData as WeightTargetFormData);
    } catch (error) {
      console.error('Error upserting weight target:', error);
      throw error;
    }
  }

  async deleteWeightTarget(petId: string): Promise<void> {
    try {
      await this.repository.deleteWeightTarget(petId);
    } catch (error) {
      console.error('Error deleting weight target:', error);
      throw error;
    }
  }

  mapError(error: unknown): WeightTargetError {
    let message: string;
    let field: keyof WeightTargetFormData | undefined;
    let code: string;

    // Handle validation errors from validator
    if (error instanceof ValidationError) {
      return {
        message: error.message,
        field: error.field as keyof WeightTargetFormData,
        code: error.code,
      };
    }
    
    // Handle API errors
    if (error instanceof NotFoundError) {
      return {
        message: 'Weight target not found',
        code: 'TARGET_NOT_FOUND',
      };
    }
    
    if (error instanceof UnauthorizedError) {
      return {
        message: 'You must be logged in to perform this action',
        code: 'UNAUTHORIZED',
      };
    }
    
    if (error instanceof ForbiddenError) {
      return {
        message: 'You do not have permission to access this weight target',
        code: 'FORBIDDEN',
      };
    }
    
    if (error instanceof ApiError) {
      message = error.message;
      code = error.code;
    } else if (error instanceof Error) {
      message = error.message;
      code = 'TARGET_ERROR';
    } else if (typeof error === 'string') {
      message = error;
      code = 'TARGET_ERROR';
    } else {
      message = 'An error occurred while processing your request';
      code = 'TARGET_ERROR';
    }

    // Map specific validation errors to fields
    if (message.includes('minimum') || message.includes('min')) {
      field = 'minWeight';
      code = 'INVALID_MIN_WEIGHT';
    } else if (message.includes('maximum') || message.includes('max')) {
      field = 'maxWeight';
      code = 'INVALID_MAX_WEIGHT';
    } else if (message.includes('unit')) {
      field = 'weightUnit';
      code = 'INVALID_UNIT';
    } else if (message.includes('not found')) {
      code = 'TARGET_NOT_FOUND';
    } else if (message.includes('unauthorized') || message.includes('forbidden')) {
      code = 'UNAUTHORIZED';
    }

    return {
      message,
      field,
      code,
    };
  }
}