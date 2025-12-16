import { VetService } from './service';
import { vetRepository } from './repository';
import { vetValidator } from './validator';
import type { VeterinarianFormData } from '@/types/veterinarian';

// Create configured service instance
const vetService = new VetService(vetRepository, vetValidator);

// Export the same interface as your current vetApi
export const vetApi = {
  getVeterinarians: () => vetService.getVeterinarians(),
  getVeterinarianById: (vetId: string) => vetService.getVeterinarianById(vetId),
  createVeterinarian: (
    vetData: VeterinarianFormData,
    options?: { petIds?: string[] }
  ) => vetService.createVeterinarian(vetData, options),
  updateVeterinarian: (vetId: string, vetData: Partial<VeterinarianFormData>) =>
    vetService.updateVeterinarian(vetId, vetData),
  deleteVeterinarian: (vetId: string) => vetService.deleteVeterinarian(vetId),
  assignVetToPets: (vetId: string, petIds: string[]) =>
    vetService.assignVetToPets(vetId, petIds),
  unassignVetFromPets: (vetId: string, petIds: string[]) =>
    vetService.unassignVetFromPets(vetId, petIds),
  getVetPets: (vetId: string) => vetService.getVetPets(vetId),
};

// Export error handler using service
export const vetErrorHandler = (error: unknown) => vetService.mapError(error);

// Export types for consumers
export type { VeterinariansApiResponse, VeterinarianError } from './types';

// Export individual components for testing or advanced use
export { VetRepository } from './repository';
export { VetValidator } from './validator';
export { VetService } from './service';