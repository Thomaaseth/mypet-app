import { get, post, put, del } from '../../base';
import type { VeterinariansApiResponse } from './types';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

// Handles data access operations using existing API functions
export class VetRepository {
  async getVeterinarians(): Promise<VeterinariansApiResponse> {
    return await get<VeterinariansApiResponse>('/api/vets');
  }

  async getVeterinarianById(vetId: string): Promise<Veterinarian> {
    const result = await get<{ veterinarian: Veterinarian }>(`/api/vets/${vetId}`);
    return result.veterinarian;
  }

  async createVeterinarian(
    vetData: VeterinarianFormData,
    options?: { petIds?: string[]; isPrimaryForPet?: boolean }
  ): Promise<Veterinarian> {
    const body = {
      ...vetData,
      ...options,
    };
    const result = await post<{ veterinarian: Veterinarian }, typeof body>('/api/vets', body);
    return result.veterinarian;
  }

  async updateVeterinarian(
    vetId: string,
    vetData: Partial<VeterinarianFormData>
  ): Promise<Veterinarian> {
    const result = await put<{ veterinarian: Veterinarian }, Partial<VeterinarianFormData>>(
      `/api/vets/${vetId}`,
      vetData
    );
    return result.veterinarian;
  }

  async deleteVeterinarian(vetId: string): Promise<void> {
    await del<{ message: string }>(`/api/vets/${vetId}`);
  }

  async assignVetToPets(
    vetId: string,
    petIds: string[],
    isPrimaryForPet: boolean = false
  ): Promise<void> {
    await post(`/api/vets/${vetId}/assign`, { petIds, isPrimaryForPet });
  }

  async unassignVetFromPets(vetId: string, petIds: string[]): Promise<void> {
    await post(`/api/vets/${vetId}/unassign`, { petIds });
  }

  async getVetPets(vetId: string): Promise<Array<{ petId: string; isPrimaryForPet: boolean }>> {
    const result = await get<{ pets: Array<{ petId: string; isPrimaryForPet: boolean }> }>(
      `/api/vets/${vetId}/pets`
    );
    return result.pets;
  }
}

// Default repository instance
export const vetRepository = new VetRepository();