import type { WeightRepository } from './repository';
import type { WeightValidator } from './validator';
import type { 
  WeightEntriesApiResponse,
  WeightEntry,
  WeightFormData,
  WeightError
} from '@/types/weights';
import type { WeightUnit } from '@/types/pet';
import {
  ApiError,
  NotFoundError,
//   ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '../../errors';

export class WeightService {
  constructor(
    private repository: WeightRepository,
    private validator: WeightValidator
  ) {}

  async getWeightEntries(petId: string): Promise<WeightEntriesApiResponse> {
    try {
      return await this.repository.getWeightEntries(petId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWeightEntryById(petId: string, weightId: string): Promise<WeightEntry> {
    try {
      return await this.repository.getWeightEntryById(petId, weightId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createWeightEntry(
    petId: string, 
    weightData: WeightFormData, 
  ): Promise<WeightEntry> {
    try {
      // Validate the data
      this.validator.validateWeightEntry(weightData, weightData.weightUnit);
      
      return await this.repository.createWeightEntry(petId, weightData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateWeightEntry(
    petId: string,
    weightId: string,
    weightData: Partial<WeightFormData>,
  ): Promise<WeightEntry> {
    try {
      // Only validate if weight or date is being updated
      if (weightData.weight || weightData.date) {
        const fullData: WeightFormData = {
          weight: weightData.weight || '0', // Will be validated anyway
          weightUnit: weightData.weightUnit || 'kg', // Fallback if not provided
          date: weightData.date || new Date().toISOString().split('T')[0]
        };
        this.validator.validateWeightEntry(fullData, fullData.weightUnit);
      }
      
      return await this.repository.updateWeightEntry(petId, weightId, weightData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteWeightEntry(petId: string, weightId: string): Promise<void> {
    try {
      await this.repository.deleteWeightEntry(petId, weightId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling - follows the same pattern as PetService
  private handleError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ApiError(error.message, 500, 'WEIGHT_ERROR');
    }
    
    return new ApiError('An unexpected error occurred', 500, 'WEIGHT_ERROR');
  }

  // Error mapping for UI consumption - follows petService pattern
  mapError(error: unknown): WeightError {
    let message = 'An error occurred while processing your request';
    let field: keyof WeightFormData | undefined;
    let code = 'WEIGHT_ERROR';

    if (error instanceof UnauthorizedError) {
      return {
        message: 'You must be logged in to perform this action',
        code: 'UNAUTHORIZED',
      };
    }
    
    if (error instanceof ForbiddenError) {
      return {
        message: 'You do not have permission to access this pet\'s weight data',
        code: 'FORBIDDEN',
      };
    }
    
    if (error instanceof NotFoundError) {
      return {
        message: 'Weight entry not found',
        code: 'WEIGHT_NOT_FOUND',
      };
    }
    
    if (error instanceof ApiError) {
      message = error.message;
      code = error.code;
    } else if (error instanceof Error) {
      message = error.message;
      code = 'WEIGHT_ERROR';
    } else if (typeof error === 'string') {
      message = error;
      code = 'WEIGHT_ERROR';
    }

    // Map specific validation errors to fields
    if (message.toLowerCase().includes('weight')) {
      field = 'weight';
      code = 'INVALID_WEIGHT';
    } else if (message.toLowerCase().includes('date')) {
      field = 'date';
      code = 'INVALID_DATE';
    } else if (message.toLowerCase().includes('future')) {
      field = 'date';
      code = 'FUTURE_DATE';
    } else if (message.toLowerCase().includes('not found')) {
      code = 'WEIGHT_NOT_FOUND';
    } else if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('forbidden')) {
      code = 'UNAUTHORIZED';
    }

    return {
      message,
      field,
      code,
    };
  }
}