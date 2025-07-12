import { get, post, put, del } from './base';  // Use base functions directly
import { ValidationError } from './errors';
import type { Pet, PetFormData, PetsApiResponse, PetError } from '@/types/pet';

export const petApi = {

  async getPets(): Promise<PetsApiResponse> {
    try {
      return await get<PetsApiResponse>('/api/pets');
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  },

  async getPetById(petId: string): Promise<Pet> {
    try {
      const result = await get<{ pet: Pet }>(`/api/pets/${petId}`);
      return result.pet;
    } catch (error) {
      console.error('Error fetching pet:', error);
      throw error;
    }
  },

  async createPet(petData: PetFormData): Promise<Pet> {
    try {
      const result = await post<{ pet: Pet }, PetFormData>('/api/pets', petData);
      return result.pet;
    } catch (error) {
      console.error('Error creating pet:', error);
      throw error;
    }
  },

  async updatePet(petId: string, petData: Partial<PetFormData>): Promise<Pet> {
    try {
      const result = await put<{ pet: Pet }, Partial<PetFormData>>(`/api/pets/${petId}`, petData);
      return result.pet;
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  },

  async deletePet(petId: string): Promise<void> {
    try {
      await del<{ message: string }>(`/api/pets/${petId}`);
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  },

  async permanentlyDeletePet(petId: string): Promise<void> {
    try {
      await del<{ message: string }>(`/api/pets/${petId}/permanent`);
    } catch (error) {
      console.error('Error permanently deleting pet:', error);
      throw error;
    }
  },

  async getPetCount(): Promise<number> {
    try {
      const result = await get<{ count: number }>('/api/pets/stats/count');
      return result.count;
    } catch (error) {
      console.error('Error fetching pet count:', error);
      throw error;
    }
  },
};

export const petErrorHandler = (error: unknown): PetError => {
  let message: string;
  let field: keyof PetFormData | undefined;
  let code: string;

  // Handle API error types
  if (error instanceof ValidationError) {
    message = error.message;
    field = error.field as keyof PetFormData;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
    code = 'PET_ERROR';
  } else if (typeof error === 'string') {
    message = error;
    code = 'PET_ERROR';
  } else {
    message = 'An error occurred while processing your request';
    code = 'PET_ERROR';
  }

  // Map specific validation errors to fields
  if (message.includes('name')) {
    field = 'name';
    code = 'INVALID_NAME';
  } else if (message.includes('species') || message.includes('breed')) {
    field = 'species';
    code = 'INVALID_SPECIES';
  } else if (message.includes('weight')) {
    field = 'weight';
    code = 'INVALID_WEIGHT';
  } else if (message.includes('birth') || message.includes('date')) {
    field = 'birthDate';
    code = 'INVALID_DATE';
  } else if (message.includes('microchip')) {
    field = 'microchipNumber';
    code = 'INVALID_MICROCHIP';
  } else if (message.includes('not found')) {
    code = 'PET_NOT_FOUND';
  } else if (message.includes('unauthorized') || message.includes('forbidden')) {
    code = 'UNAUTHORIZED';
  }

  return {
    message,
    field,
    code,
  };
};