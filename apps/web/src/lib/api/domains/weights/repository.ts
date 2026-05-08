import { get, post, put, del } from '../../base';
import type { 
  WeightEntry,
  WeightFormData
} from '@/types/weights';
import type { WeightUnit } from '@/types/pet';

// Handles data access operations using existing API functions
export class WeightRepository {
  
  async getWeightEntries(petId: string): Promise<WeightEntry[]> {
    const result = await get<{ weightEntries: WeightEntry[]; weightUnit: WeightUnit }>(
      `/api/pets/${petId}/weights`
    );
    return result.weightEntries;
  }

  async getWeightEntryById(petId: string, weightId: string): Promise<WeightEntry> {
    const result = await get<{ weightEntry: WeightEntry }>(`/api/pets/${petId}/weights/${weightId}`);
    return result.weightEntry;
  }

  async createWeightEntry(petId: string, weightData: WeightFormData): Promise<WeightEntry> {
    const result = await post<{ weightEntry: WeightEntry }, WeightFormData>(
      `/api/pets/${petId}/weights`, 
      weightData
    );
    return result.weightEntry;
  }

  async updateWeightEntry(
    petId: string, 
    weightId: string, 
    weightData: Partial<WeightFormData>
  ): Promise<WeightEntry> {
    const result = await put<{ weightEntry: WeightEntry }, Partial<WeightFormData>>(
      `/api/pets/${petId}/weights/${weightId}`, 
      weightData
    );
    return result.weightEntry;
  }

  async deleteWeightEntry(petId: string, weightId: string): Promise<void> {
    await del<{ message: string }>(`/api/pets/${petId}/weights/${weightId}`);
  }
}

// Default repository instance
export const weightRepository = new WeightRepository();