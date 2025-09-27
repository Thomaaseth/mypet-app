import type { FoodRepository } from './repository';
import type { FoodValidator } from './validator';
import type { 
  DryFoodEntry, 
  WetFoodEntry, 
  DryFoodFormData, 
  WetFoodFormData,
  DryFoodEntriesApiResponse,
  WetFoodEntriesApiResponse,
  AllFoodEntriesApiResponse
} from '@/types/food';
import { 
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '../../errors';

export type FoodError = {
  message: string;
  field?: keyof (DryFoodFormData & WetFoodFormData);
  code: string;
}

export class FoodService {
  constructor(
    private repository: FoodRepository,
    private validator: FoodValidator
  ) {}

  // Dry food methods
  async getDryFoodEntries(petId: string): Promise<DryFoodEntriesApiResponse> {
    try {
      this.validator.validatePetId(petId);
      return await this.repository.getDryFoodEntries(petId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDryFoodEntryById(petId: string, foodId: string): Promise<DryFoodEntry> {
    try {
      this.validator.validatePetId(petId);
      this.validator.validateFoodId(foodId);
      return await this.repository.getDryFoodEntryById(petId, foodId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createDryFoodEntry(petId: string, foodData: DryFoodFormData): Promise<DryFoodEntry> {
    try {
      this.validator.validatePetId(petId);
      const validatedData = this.validator.validateDryFoodData(foodData);
      return await this.repository.createDryFoodEntry(petId, validatedData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateDryFoodEntry(
      petId: string, 
      foodId: string, 
      foodData: Partial<DryFoodFormData>
    ): Promise<DryFoodEntry> {
      try {
        this.validator.validatePetId(petId);
        this.validator.validateFoodId(foodId);
        const validatedData = this.validator.validateUpdateDryFoodData(foodData);
        return await this.repository.updateDryFoodEntry(petId, foodId, validatedData);
      } catch (error) {
        throw this.handleError(error);
      }
    }

  // Wet food methods
  async getWetFoodEntries(petId: string): Promise<WetFoodEntriesApiResponse> {
    try {
      this.validator.validatePetId(petId);
      return await this.repository.getWetFoodEntries(petId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWetFoodEntryById(petId: string, foodId: string): Promise<WetFoodEntry> {
    try {
      this.validator.validatePetId(petId);
      this.validator.validateFoodId(foodId);
      return await this.repository.getWetFoodEntryById(petId, foodId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createWetFoodEntry(petId: string, foodData: WetFoodFormData): Promise<WetFoodEntry> {
    try {
      this.validator.validatePetId(petId);
      const validatedData = this.validator.validateWetFoodData(foodData)
      return await this.repository.createWetFoodEntry(petId, validatedData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateWetFoodEntry(
    petId: string, 
    foodId: string, 
    foodData: Partial<WetFoodFormData>
  ): Promise<WetFoodEntry> {
    try {
      this.validator.validatePetId(petId);
      this.validator.validateFoodId(foodId);
      const validatedData = this.validator.validateUpdateWetFoodData(foodData);
      return await this.repository.updateWetFoodEntry(petId, foodId, validatedData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Combined methods
  async getAllFoodEntries(petId: string): Promise<AllFoodEntriesApiResponse> {
    try {
      this.validator.validatePetId(petId);
      return await this.repository.getAllFoodEntries(petId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteFoodEntry(petId: string, foodId: string): Promise<void> {
    try {
      this.validator.validatePetId(petId);
      this.validator.validateFoodId(foodId)
      return await this.repository.deleteFoodEntry(petId, foodId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async markFoodAsFinished(petId: string, foodId: string): Promise<DryFoodEntry | WetFoodEntry> {
    try {
      this.validator.validatePetId(petId);
      this.validator.validateFoodId(foodId);
      return await this.repository.markFoodAsFinished(petId, foodId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  //Error handling
  private handleError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    } 
    if (error instanceof Error) {
      return new ApiError(error.message, 500, 'FOOD_ERROR');
    }
    return new ApiError('An unexpected error occurred', 500, 'FOOD_ERROR');
  }

  mapError(error: unknown): FoodError {
      let message = 'An error occurred while processing your request';
      let field: keyof (DryFoodFormData & WetFoodFormData) | undefined;
      let code = 'FOOD_ERROR';

      if (error instanceof ValidationError) {
        message = error.message;
        field = error.field as keyof (DryFoodFormData & WetFoodFormData);
        code = 'VALIDATION_ERROR';
      } else if (error instanceof NotFoundError) {
        message = 'Food entry not found';
        code = 'NOT_FOUND';
      } else if (error instanceof UnauthorizedError) {
        message = 'You must be logged in to perform this action';
        code = 'UNAUTHORIZED';
      } else if (error instanceof ForbiddenError) {
        message = 'You do not have permission to perform this action';
        code = 'FORBIDDEN';
      } else if (error instanceof ApiError) {
        message = error.message;
        code = error.code || 'API_ERROR';
      } else if (error instanceof Error) {
        message = error.message;
      }

      return { message, field, code };
    }
  }