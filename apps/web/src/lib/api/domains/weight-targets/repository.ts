import { get, put, del } from '../../base';
import type { WeightTarget, WeightTargetFormData } from '@/types/weight-targets';

export class WeightTargetRepository {
    async getWeightTarget(petId: string): Promise<WeightTarget | null> {
        const response = await get<{ weightTarget: WeightTarget | null }>(
          `/api/pets/${petId}/weight-target`
        );
        return response.weightTarget;
    }
  
    async upsertWeightTarget(
      petId: string,
      targetData: WeightTargetFormData
    ): Promise<WeightTarget> {
        const response = await put<{ weightTarget: WeightTarget }, WeightTargetFormData>(
          `/api/pets/${petId}/weight-target`,
          targetData
        );
        return response.weightTarget;
    }
  
    async deleteWeightTarget(petId: string): Promise<void> {
        await del<{ message: string }>(`/api/pets/${petId}/weight-target`);
    }
  }
  
  export const weightTargetRepository = new WeightTargetRepository();