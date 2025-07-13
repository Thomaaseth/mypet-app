import { get, post, put, del } from '../../base';
import type { PetsApiResponse } from './types';
import type { Pet, PetFormData } from '@/types/pet';


// Handles data access operations using existing API functions
export class PetRepository {
  async getPets(): Promise<PetsApiResponse> {
    return await get<PetsApiResponse>('/api/pets');
  }

  async getPetById(petId: string): Promise<Pet> {
    const result = await get<{ pet: Pet }>(`/api/pets/${petId}`);
    return result.pet;
  }

  async createPet(petData: PetFormData): Promise<Pet> {
    const result = await post<{ pet: Pet }, PetFormData>('/api/pets', petData);
    return result.pet;
  }

  async updatePet(petId: string, petData: Partial<PetFormData>): Promise<Pet> {
    const result = await put<{ pet: Pet }, Partial<PetFormData>>(`/api/pets/${petId}`, petData);
    return result.pet;
  }

  async deletePet(petId: string): Promise<void> {
    await del<{ message: string }>(`/api/pets/${petId}`);
  }

  async permanentlyDeletePet(petId: string): Promise<void> {
    await del<{ message: string }>(`/api/pets/${petId}/permanent`);
  }

  async getPetCount(): Promise<number> {
    const result = await get<{ count: number }>('/api/pets/stats/count');
    return result.count;
  }
}

// Default repository instance
export const petRepository = new PetRepository();