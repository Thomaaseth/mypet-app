import { get, post, put, del } from '../../base';
import type { PetApiResponse, PetImageUploadResponse, PetSignedUrlResponse } from './types';
import type { Pet, PetFormData } from '@/types/pet';


// Handles data access operations using existing API functions
export class PetRepository {
  
  async getPets(): Promise<Pet[]> {
    const result = await get<{ pets: Pet[] }>('/api/pets');
    return result.pets
  }

  async getPetById(petId: string): Promise<Pet> {
    const result = await get<PetApiResponse>(`/api/pets/${petId}`);
    return result.pet;
  }

  async getPetSignedUrl(petId: string): Promise<string | null> {
    const result = await get<PetSignedUrlResponse>(`/api/pets/${petId}/signed-url`);
    return result.signedUrl;
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

  async uploadPetImage(petId: string, file: File): Promise<PetImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    const result = await post<PetImageUploadResponse, FormData>(`/api/pets/${petId}/image`, formData);
    return result;
  }

  async deletePetImage(petId: string): Promise<Pet>{
    const result = await del<{ pet: Pet}>(`/api/pets/${petId}/image`);
    return result.pet;
  }
}


// Default repository instance
export const petRepository = new PetRepository();