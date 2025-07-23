import type { FoodRepository } from './repository';
import type { FoodValidator } from './validator';
import type { 
  FoodEntry, 
  FoodFormData, 
  FoodEntriesApiResponse,
  FoodError,
  FoodType
} from '@/types/food';
import { 
  ApiError,
//   BadRequestError,
//   NotFoundError,
//   ValidationError,
//   NetworkError,
//   ServerError,
//   createApiError 
} from '../../errors';

export class FoodService {
  constructor(
    private repository: FoodRepository,
    private validator: FoodValidator
  ) {}

  async getFoodEntries(petId: string): Promise<FoodEntriesApiResponse> {
    try {
      const validPetId = this.validator.validatePetId(petId);
      return await this.repository.getFoodEntries(validPetId);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async getFoodEntriesByType(petId: string, foodType: FoodType): Promise<FoodEntriesApiResponse> {
    try {
      const validPetId = this.validator.validatePetId(petId);
      return await this.repository.getFoodEntriesByType(validPetId, foodType);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async getFoodEntryById(petId: string, foodId: string): Promise<FoodEntry> {
    try {
      const validPetId = this.validator.validatePetId(petId);
      const validFoodId = this.validator.validateFoodId(foodId);
      return await this.repository.getFoodEntryById(validPetId, validFoodId);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async createFoodEntry(petId: string, foodData: FoodFormData): Promise<FoodEntry> {
    try {
      const validPetId = this.validator.validatePetId(petId);
      const validFoodData = this.validator.validateCreateFood(foodData);
      
      return await this.repository.createFoodEntry(validPetId, validFoodData);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async updateFoodEntry(
    petId: string, 
    foodId: string, 
    foodData: Partial<FoodFormData>
  ): Promise<FoodEntry> {
    try {
      const validPetId = this.validator.validatePetId(petId);
      const validFoodId = this.validator.validateFoodId(foodId);
      const validFoodData = this.validator.validateUpdateFood(foodData);
      
      return await this.repository.updateFoodEntry(validPetId, validFoodId, validFoodData);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async deleteFoodEntry(petId: string, foodId: string): Promise<void> {
    try {
      const validPetId = this.validator.validatePetId(petId);
      const validFoodId = this.validator.validateFoodId(foodId);
      
      await this.repository.deleteFoodEntry(validPetId, validFoodId);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  // Error mapping utility
  mapError(error: unknown): FoodError {
    if (error instanceof ApiError) {
      return {
        message: error.message,
        code: error.code || 'API_ERROR'
      };
    }

    if (error instanceof Error) {
      // Handle validation errors
      if (error.message.includes('Validation failed')) {
        return {
          message: error.message.replace('Validation failed: ', ''),
          code: 'VALIDATION_ERROR'
        };
      }

      // Handle network and server errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return {
          message: 'Network error. Please check your connection and try again.',
          code: 'NETWORK_ERROR'
        };
      }
    }

    // Default error
    return {
      message: 'An unexpected error occurred while processing food data',
      code: 'UNKNOWN_ERROR'
    };
  }
}