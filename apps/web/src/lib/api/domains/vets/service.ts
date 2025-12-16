import type { VeterinariansApiResponse, VeterinarianError } from './types';
import type { VetRepository } from './repository';
import type { VetValidator } from './validator';
import { 
  ApiError, 
  ValidationError, 
  NotFoundError,
  UnauthorizedError,
  ForbiddenError 
} from '../../errors';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

export class VetService {
  constructor(
    private repository: VetRepository,
    private validator: VetValidator
  ) {}

  async getVeterinarians(): Promise<VeterinariansApiResponse> {
    try {
      return await this.repository.getVeterinarians();
    } catch (error) {
      console.error('Error fetching veterinarians:', error);
      throw error;
    }
  }

  async getVeterinarianById(vetId: string): Promise<Veterinarian> {
    try {
      return await this.repository.getVeterinarianById(vetId);
    } catch (error) {
      console.error('Error fetching veterinarian:', error);
      throw error;
    }
  }

  async createVeterinarian(
    vetData: VeterinarianFormData,
    options?: { petIds?: string[]; isPrimaryForPet?: boolean }
  ): Promise<Veterinarian> {
    try {
      // Business validation
      this.validator.validateVetData(vetData, false);
      
      // Transform data
      const transformedData = this.validator.transformVetData(vetData) as VeterinarianFormData;
      
      return await this.repository.createVeterinarian(transformedData, options);
    } catch (error) {
      console.error('Error creating veterinarian:', error);
      throw error;
    }
  }

  async updateVeterinarian(
    vetId: string,
    vetData: Partial<VeterinarianFormData>
  ): Promise<Veterinarian> {
    try {
      // Business validation
      this.validator.validateVetData(vetData, true);
      
      // Transform data
      const transformedData = this.validator.transformVetData(vetData);
      
      return await this.repository.updateVeterinarian(vetId, transformedData);
    } catch (error) {
      console.error('Error updating veterinarian:', error);
      throw error;
    }
  }

  async deleteVeterinarian(vetId: string): Promise<void> {
    try {
      return await this.repository.deleteVeterinarian(vetId);
    } catch (error) {
      console.error('Error deleting veterinarian:', error);
      throw error;
    }
  }

  async assignVetToPets(
    vetId: string,
    petIds: string[],
  ): Promise<void> {
    try {
      return await this.repository.assignVetToPets(vetId, petIds);
    } catch (error) {
      console.error('Error assigning vet to pets:', error);
      throw error;
    }
  }

  async unassignVetFromPets(vetId: string, petIds: string[]): Promise<void> {
    try {
      return await this.repository.unassignVetFromPets(vetId, petIds);
    } catch (error) {
      console.error('Error unassigning vet from pets:', error);
      throw error;
    }
  }

  async getVetPets(vetId: string): Promise<Array<{ petId: string }>> {
    try {
      return await this.repository.getVetPets(vetId);
    } catch (error) {
      console.error('Error fetching vet pets:', error);
      throw error;
    }
  }

  mapError(error: unknown): VeterinarianError {
    let message: string;
    let field: keyof VeterinarianFormData | undefined;
    let code: string;

    if (error instanceof ValidationError) {
      message = error.message;
      field = error.field as keyof VeterinarianFormData;
      code = error.code;
    } else if (error instanceof NotFoundError) {
      message = error.message;
      code = 'VET_NOT_FOUND';
    } else if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      message = 'You do not have permission to perform this action';
      code = 'UNAUTHORIZED';
    } else if (error instanceof ApiError) {
      message = error.message;
      code = error.code;
    } else if (error instanceof Error) {
      message = error.message;
      code = 'VET_ERROR';
    } else {
      message = 'An unknown error occurred';
      code = 'UNKNOWN_ERROR';
    }

    // Map specific validation errors to fields
    if (message.toLowerCase().includes('vet name') || message.toLowerCase().includes('veterinarian name')) {
      field = 'vetName';
      code = 'INVALID_VET_NAME';
    } else if (message.toLowerCase().includes('clinic')) {
      field = 'clinicName';
      code = 'INVALID_CLINIC_NAME';
    } else if (message.toLowerCase().includes('phone')) {
      field = 'phone';
      code = 'INVALID_PHONE';
    } else if (message.toLowerCase().includes('email')) {
      field = 'email';
      code = 'INVALID_EMAIL';
    } else if (message.toLowerCase().includes('website')) {
      field = 'website';
      code = 'INVALID_WEBSITE';
    } else if (message.toLowerCase().includes('address')) {
      field = 'addressLine1';
      code = 'INVALID_ADDRESS';
    } else if (message.toLowerCase().includes('city')) {
      field = 'city';
      code = 'INVALID_CITY';
    } else if (message.toLowerCase().includes('zip') || message.toLowerCase().includes('postal')) {
      field = 'zipCode';
      code = 'INVALID_ZIP_CODE';
    }

    return { message, field, code };
  }
}