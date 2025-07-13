import type { PetsApiResponse, PetError } from './types';
import type { PetRepository } from './repository';
import type { PetValidator } from './validator';
import { 
  ApiError, 
  ValidationError, 
  NotFoundError,
  UnauthorizedError,
  ForbiddenError 
} from '../../errors';
import type { Pet, PetFormData } from '@/types/pet';

export class PetService {
  constructor(
    private repository: PetRepository,
    private validator: PetValidator
  ) {}

  async getPets(): Promise<PetsApiResponse> {
    try {
      return await this.repository.getPets();
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  }

  async getPetById(petId: string): Promise<Pet> {
    try {
      return await this.repository.getPetById(petId);
    } catch (error) {
      console.error('Error fetching pet:', error);
      throw error;
    }
  }

  async createPet(petData: PetFormData): Promise<Pet> {
    try {
      // Business validation
      this.validator.validatePetData(petData, false);
      
      // Transform data
      const transformedData = this.validator.transformPetData(petData) as PetFormData;
      
      return await this.repository.createPet(transformedData);
    } catch (error) {
      console.error('Error creating pet:', error);
      throw error;
    }
  }

  async updatePet(petId: string, petData: Partial<PetFormData>): Promise<Pet> {
    try {
      // Business validation
      this.validator.validatePetData(petData, true);
      
      // Transform data
      const transformedData = this.validator.transformPetData(petData);
      
      return await this.repository.updatePet(petId, transformedData);
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  }

  async deletePet(petId: string): Promise<void> {
    try {
      await this.repository.deletePet(petId);
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  }

  async permanentlyDeletePet(petId: string): Promise<void> {
    try {
      await this.repository.permanentlyDeletePet(petId);
    } catch (error) {
      console.error('Error permanently deleting pet:', error);
      throw error;
    }
  }

  async getPetCount(): Promise<number> {
    try {
      return await this.repository.getPetCount();
    } catch (error) {
      console.error('Error fetching pet count:', error);
      throw error;
    }
  }

  mapError(error: unknown): PetError {
    let message: string;
    let field: keyof PetFormData | undefined;
    let code: string;

    // Handle validation errors from validator
    if (error instanceof ValidationError) {
      return {
        message: error.message,
        field: error.field as keyof PetFormData,
        code: error.code,
      };
    }
    
    // Handle API errors
    if (error instanceof NotFoundError) {
      return {
        message: 'Pet not found',
        code: 'PET_NOT_FOUND',
      };
    }
    
    if (error instanceof UnauthorizedError) {
      return {
        message: 'You must be logged in to perform this action',
        code: 'UNAUTHORIZED',
      };
    }
    
    if (error instanceof ForbiddenError) {
      return {
        message: 'You do not have permission to access this pet',
        code: 'FORBIDDEN',
      };
    }
    
    if (error instanceof ApiError) {
      message = error.message;
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
  }
}