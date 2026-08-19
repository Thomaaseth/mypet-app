import { PetService } from './service';
import { petRepository } from './repository';
import { petNormalizer } from './validator';
import type { PetEditFormData, PetFormData } from '@/lib/validations/pet';

// Create configured service instance
const petService = new PetService(petRepository, petNormalizer);

// Export the same interface as your current petApi
export const petApi = {
  getPets: () => petService.getPets(),
  getPetById: (petId: string) => petService.getPetById(petId),
  createPet: (petData: PetFormData) => petService.createPet(petData),
  updatePet: (petId: string, petData: PetEditFormData) => petService.updatePet(petId, petData),  deletePet: (petId: string) => petService.deletePet(petId),
  permanentlyDeletePet: (petId: string) => petService.permanentlyDeletePet(petId),
  getPetSignedUrl: (petId: string) => petService.getPetSignedUrl(petId),
  uploadPetImage: (petId: string, file: File) => petService.uploadPetImage(petId, file),
  deletePetImage: (petId: string) => petService.deletePetImage(petId),
  setPetFavorite: (petId: string, isFavorite: boolean) => petService.setPetFavorite(petId, isFavorite),
};

// Export the same error handler interface
export const petErrorHandler = (error: unknown) => petService.mapError(error);

// Export types for consumers
export type { PetError, PetImageUploadResponse } from './types';

// Export individual components for testing or advanced use
export { PetRepository } from './repository';
export { PetNormalizer } from './validator';
export { PetService } from './service';
