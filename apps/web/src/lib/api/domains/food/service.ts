import type { FoodRepository } from './repository';
import type { 
  DryFoodEntry, 
  WetFoodEntry, 
  DryFoodFormData, 
  WetFoodFormData,
  DryFoodEntriesApiResponse,
  WetFoodEntriesApiResponse,
  AllFoodEntriesApiResponse
} from '@/types/food';
import { ApiError } from '../../errors';

export class FoodService {
  constructor(private repository: FoodRepository) {}

  // Dry food methods
  async getDryFoodEntries(petId: string): Promise<DryFoodEntriesApiResponse> {
    try {
      return await this.repository.getDryFoodEntries(petId);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async createDryFoodEntry(petId: string, foodData: DryFoodFormData): Promise<DryFoodEntry> {
    try {
      return await this.repository.createDryFoodEntry(petId, foodData);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async updateDryFoodEntry(petId: string, foodId: string, foodData: Partial<DryFoodFormData>): Promise<DryFoodEntry> {
    try {
      return await this.repository.updateDryFoodEntry(petId, foodId, foodData);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  // Wet food methods
  async getWetFoodEntries(petId: string): Promise<WetFoodEntriesApiResponse> {
    try {
      return await this.repository.getWetFoodEntries(petId);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async createWetFoodEntry(petId: string, foodData: WetFoodFormData): Promise<WetFoodEntry> {
    try {
      return await this.repository.createWetFoodEntry(petId, foodData);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async updateWetFoodEntry(petId: string, foodId: string, foodData: Partial<WetFoodFormData>): Promise<WetFoodEntry> {
    try {
      return await this.repository.updateWetFoodEntry(petId, foodId, foodData);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  // Combined methods
  async getAllFoodEntries(petId: string): Promise<AllFoodEntriesApiResponse> {
    try {
      return await this.repository.getAllFoodEntries(petId);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async deleteFoodEntry(petId: string, foodId: string): Promise<void> {
    try {
      return await this.repository.deleteFoodEntry(petId, foodId);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  mapError(error: unknown): ApiError {
    // Your existing error mapping logic
    if (error instanceof ApiError) {
      return error;
    }
    return new ApiError('An unexpected error occurred');
  }
}