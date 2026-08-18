import type { AntiParasiteTreatmentError } from './types';
import type { AntiParasiteTreatmentRepository } from './repository';
import { ApiError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../errors';
import type { AntiParasiteTreatment, AntiParasiteTreatmentFormData } from '@/types/anti-parasite-treatments';
import type { UpdateAntiParasiteTreatmentData } from '@/lib/validations/anti-parasite-treatment';

// Orchestrates repository calls and maps errors. No validation here —
// enforced at the form (zodResolver + shared schema) and the server (strict
// schema). This layer only moves data and normalizes error shapes.
export class AntiParasiteTreatmentService {
  constructor(private repository: AntiParasiteTreatmentRepository) {}

  async getTreatments(petId: string): Promise<AntiParasiteTreatment[]> {
    try {
      return await this.repository.getTreatments(petId);
    } catch (error) {
      console.error('Error fetching anti-parasite treatments:', error);
      throw error;
    }
  }

  async getTreatmentById(petId: string, treatmentId: string): Promise<AntiParasiteTreatment> {
    try {
      return await this.repository.getTreatmentById(petId, treatmentId);
    } catch (error) {
      console.error('Error fetching anti-parasite treatment:', error);
      throw error;
    }
  }

  async createTreatment(
    petId: string,
    data: AntiParasiteTreatmentFormData,
  ): Promise<AntiParasiteTreatment> {
    try {
      return await this.repository.createTreatment(petId, data);
    } catch (error) {
      console.error('Error creating anti-parasite treatment:', error);
      throw error;
    }
  }

  async updateTreatment(
    petId: string,
    treatmentId: string,
    data: UpdateAntiParasiteTreatmentData,
  ): Promise<AntiParasiteTreatment> {
    try {
      return await this.repository.updateTreatment(petId, treatmentId, data);
    } catch (error) {
      console.error('Error updating anti-parasite treatment:', error);
      throw error;
    }
  }

  async deleteTreatment(petId: string, treatmentId: string): Promise<void> {
    try {
      await this.repository.deleteTreatment(petId, treatmentId);
    } catch (error) {
      console.error('Error deleting anti-parasite treatment:', error);
      throw error;
    }
  }

  mapError(error: unknown): AntiParasiteTreatmentError {
    let message: string;
    let field: keyof AntiParasiteTreatmentFormData | undefined;
    let code: string;

    if (error instanceof NotFoundError) {
      return { message: 'Anti-parasite treatment not found', code: 'TREATMENT_NOT_FOUND' };
    }
    if (error instanceof UnauthorizedError) {
      return { message: 'You must be logged in to perform this action', code: 'UNAUTHORIZED' };
    }
    if (error instanceof ForbiddenError) {
      return { message: 'You do not have permission to access this treatment', code: 'FORBIDDEN' };
    }

    if (error instanceof ApiError) {
      message = error.message;
      code = error.code;
    } else if (error instanceof Error) {
      message = error.message;
      code = 'TREATMENT_ERROR';
    } else if (typeof error === 'string') {
      message = error;
      code = 'TREATMENT_ERROR';
    } else {
      message = 'An error occurred while processing your request';
      code = 'TREATMENT_ERROR';
    }

    // Map server validation messages to the field that produced them, so the
    // form can surface them inline. Message substrings come from the shared
    // schema's messages / the service's BadRequestError text.
    if (message.includes('product')) {
      field = 'productName';
      code = 'INVALID_PRODUCT_NAME';
    } else if (message.includes('categor')) {
      field = 'categories';
      code = 'INVALID_CATEGORIES';
    } else if (message.includes('duration')) {
      field = 'durationAmount';
      code = 'INVALID_DURATION';
    } else if (message.includes('date')) {
      field = 'dateAdministered';
      code = 'INVALID_DATE';
    } else if (message.includes('not found')) {
      code = 'TREATMENT_NOT_FOUND';
    } else if (message.includes('unauthorized') || message.includes('forbidden')) {
      code = 'UNAUTHORIZED';
    }

    return { message, field, code };
  }
}