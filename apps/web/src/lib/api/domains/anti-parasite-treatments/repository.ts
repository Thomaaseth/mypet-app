import { get, post, put, del } from '../../base';
import type { AntiParasiteTreatment, AntiParasiteTreatmentFormData } from '@/types/anti-parasite-treatments';
import type { UpdateAntiParasiteTreatmentData } from '@/lib/validations/anti-parasite-treatment';

// Data access only. Response envelope keys match the API routes:
// { antiParasiteTreatments, total } for lists, { antiParasiteTreatment } for singles.
export class AntiParasiteTreatmentRepository {
  async getTreatments(petId: string): Promise<AntiParasiteTreatment[]> {
    const result = await get<{ antiParasiteTreatments: AntiParasiteTreatment[]; total: number }>(
      `/api/pets/${petId}/anti-parasite-treatments`,
    );
    return result.antiParasiteTreatments;
  }

  async getTreatmentById(petId: string, treatmentId: string): Promise<AntiParasiteTreatment> {
    const result = await get<{ antiParasiteTreatment: AntiParasiteTreatment }>(
      `/api/pets/${petId}/anti-parasite-treatments/${treatmentId}`,
    );
    return result.antiParasiteTreatment;
  }

async createTreatment(
    petId: string,
    data: AntiParasiteTreatmentFormData,
  ): Promise<AntiParasiteTreatment> {
    const result = await post<{ antiParasiteTreatment: AntiParasiteTreatment }, AntiParasiteTreatmentFormData>
    (`/api/pets/${petId}/anti-parasite-treatments`, data);
    return result.antiParasiteTreatment;
  }

  async updateTreatment(
    petId: string,
    treatmentId: string,
    data: UpdateAntiParasiteTreatmentData,
  ): Promise<AntiParasiteTreatment> {
    const result = await put<{ antiParasiteTreatment: AntiParasiteTreatment }, UpdateAntiParasiteTreatmentData>
    (`/api/pets/${petId}/anti-parasite-treatments/${treatmentId}`, data);
    return result.antiParasiteTreatment;
  }

  async deleteTreatment(petId: string, treatmentId: string): Promise<void> {
    await del<{ message: string }>(`/api/pets/${petId}/anti-parasite-treatments/${treatmentId}`);
  }
}

export const antiParasiteTreatmentRepository = new AntiParasiteTreatmentRepository();