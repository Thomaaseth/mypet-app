import { get, put, del } from '../../base';
import type { WeightTarget, WeightTargetFormData } from '@/types/weight-targets';

export class WeightTargetRepository {
    async getWeightTarget(petId: string): Promise<WeightTarget | null> {
      try {
        const response = await get<{ weightTarget: WeightTarget | null }>(
          `/api/pets/${petId}/weight-target`
        );
        return response.weightTarget;
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
        const response = await put<{ weightTarget: WeightTarget }, WeightTargetFormData>(
          `/api/pets/${petId}/weight-target`,
          targetData
        );
        return response.weightTarget;
      } catch (error) {
        console.error('Error upserting weight target:', error);
        throw error;
      }
    }
  
    async deleteWeightTarget(petId: string): Promise<void> {
      try {
        await del<{ message: string }>(`/api/pets/${petId}/weight-target`);
      } catch (error) {
        console.error('Error deleting weight target:', error);
        throw error;
      }
    }
  }
  
  export const weightTargetRepository = new WeightTargetRepository();