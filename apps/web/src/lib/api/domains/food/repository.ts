import { get, post, put, del, patch } from '../../base';
import type { 
  DryFoodEntry,
  WetFoodEntry,
  DryFoodFormData,
  WetFoodFormData,
  DryFoodEntriesApiResponse,
  WetFoodEntriesApiResponse,
  AllFoodEntriesApiResponse
} from '@/types/food';

export class FoodRepository {
  // Dry food methods
  async getDryFoodEntries(petId: string): Promise<DryFoodEntriesApiResponse> {
    return await get<DryFoodEntriesApiResponse>(
      `/api/pets/${petId}/food/dry`);
  }

  async getDryFoodEntryById(petId: string, foodId: string): Promise<DryFoodEntry> {
    const result = await get<{ foodEntry: DryFoodEntry }>(
      `/api/pets/${petId}/food/dry/${foodId}`);
    return result.foodEntry;
  }

  async createDryFoodEntry(petId: string, foodData: DryFoodFormData): Promise<DryFoodEntry> {
    const result = await post<{ foodEntry: DryFoodEntry }, DryFoodFormData>(
      `/api/pets/${petId}/food/dry`, 
      foodData
    );
    return result.foodEntry;
  }

  async updateDryFoodEntry(petId: string, foodId: string, foodData: Partial<DryFoodFormData>): Promise<DryFoodEntry> {
    const result = await put<{ foodEntry: DryFoodEntry }, Partial<DryFoodFormData>>(
      `/api/pets/${petId}/food/dry/${foodId}`, 
      foodData
    );
    return result.foodEntry;
  }

  async getFinishedDryFoodEntries(petId: string, limit: number = 10): Promise<DryFoodEntriesApiResponse> {
    return await get<DryFoodEntriesApiResponse>(
      `/api/pets/${petId}/food/finished`,
      { foodType: 'dry', limit }
    );
  }

  // Wet food methods
  async getWetFoodEntries(petId: string): Promise<WetFoodEntriesApiResponse> {
    return await get<WetFoodEntriesApiResponse>(
      `/api/pets/${petId}/food/wet`);
  }

  async getWetFoodEntryById(petId: string, foodId: string): Promise<WetFoodEntry> {
    const result = await get<{ foodEntry: WetFoodEntry }>(
      `/api/pets/${petId}/food/wet/${foodId}`);
    return result.foodEntry;
  }

  async createWetFoodEntry(petId: string, foodData: WetFoodFormData): Promise<WetFoodEntry> {
    const result = await post<{ foodEntry: WetFoodEntry }, WetFoodFormData>(
      `/api/pets/${petId}/food/wet`, 
      foodData
    );
    return result.foodEntry;
  }

  async updateWetFoodEntry(petId: string, foodId: string, foodData: Partial<WetFoodFormData>): Promise<WetFoodEntry> {
    const result = await put<{ foodEntry: WetFoodEntry }, Partial<WetFoodFormData>>(
      `/api/pets/${petId}/food/wet/${foodId}`, 
      foodData
    );
    return result.foodEntry;
  }

  async getFinishedWetFoodEntries(petId: string, limit: number = 10): Promise<WetFoodEntriesApiResponse> {
    return await get<WetFoodEntriesApiResponse>(
      `/api/pets/${petId}/food/finished`,
      { foodType: 'wet', limit }
    );
  }

  // Combined methods
  async getAllFoodEntries(petId: string): Promise<AllFoodEntriesApiResponse> {
    return await get<AllFoodEntriesApiResponse>(
      `/api/pets/${petId}/food`);
  }

  async deleteFoodEntry(petId: string, foodId: string): Promise<void> {
    await del<{ message: string }>(
      `/api/pets/${petId}/food/${foodId}`);
  }

  async markFoodAsFinished(petId: string, foodId: string): Promise<DryFoodEntry | WetFoodEntry> {
    const result = await patch<{ foodEntry: DryFoodEntry | WetFoodEntry }>(
      `/api/pets/${petId}/food/${foodId}/finish`);
    return result.foodEntry;
  }

  async updateFinishDate(petId: string, foodId: string, dateFinished: string): Promise<DryFoodEntry | WetFoodEntry> {
    const result = await put<{ foodEntry: DryFoodEntry | WetFoodEntry }, { dateFinished: string }>(
      `/api/pets/${petId}/food/${foodId}/finish-date`, { dateFinished }
    );
    return result.foodEntry;
  }
}

export const foodRepository = new FoodRepository();