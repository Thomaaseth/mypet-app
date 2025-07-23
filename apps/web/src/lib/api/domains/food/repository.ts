import { get, post, put, del } from '../../base';
import type { 
  FoodEntriesApiResponse,
  FoodEntry,
  FoodFormData,
  FoodType
} from '@/types/food';

// Handles data access operations using existing API functions
export class FoodRepository {
  async getFoodEntries(petId: string): Promise<FoodEntriesApiResponse> {
    return await get<FoodEntriesApiResponse>(`/api/pets/${petId}/food`);
  }

  async getFoodEntriesByType(petId: string, foodType: FoodType): Promise<FoodEntriesApiResponse> {
    return await get<FoodEntriesApiResponse>(`/api/pets/${petId}/food/type/${foodType}`);
  }

  async getFoodEntryById(petId: string, foodId: string): Promise<FoodEntry> {
    const result = await get<{ foodEntry: FoodEntry }>(`/api/pets/${petId}/food/${foodId}`);
    return result.foodEntry;
  }

  async createFoodEntry(petId: string, foodData: FoodFormData): Promise<FoodEntry> {
    const result = await post<{ foodEntry: FoodEntry }, FoodFormData>(
      `/api/pets/${petId}/food`, 
      foodData
    );
    return result.foodEntry;
  }

  async updateFoodEntry(
    petId: string, 
    foodId: string, 
    foodData: Partial<FoodFormData>
  ): Promise<FoodEntry> {
    const result = await put<{ foodEntry: FoodEntry }, Partial<FoodFormData>>(
      `/api/pets/${petId}/food/${foodId}`, 
      foodData
    );
    return result.foodEntry;
  }

  async deleteFoodEntry(petId: string, foodId: string): Promise<void> {
    await del<{ message: string }>(`/api/pets/${petId}/food/${foodId}`);
  }
}

// Default repository instance
export const foodRepository = new FoodRepository();