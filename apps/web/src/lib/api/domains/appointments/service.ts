import type { AppointmentRepository } from './repository';
import type { AppointmentValidator } from './validator';
import { 
  ApiError, 
  ValidationError, 
  NotFoundError,
  UnauthorizedError,
  ForbiddenError 
} from '../../errors';
import type { 
  AppointmentsApiResponse,
  AppointmentWithRelations,
  AppointmentFormData,
  AppointmentError,
  AppointmentFilter,
} from '@/types/appointments';

export class AppointmentService {
  constructor(
    private repository: AppointmentRepository,
    private validator: AppointmentValidator
  ) {}

  async getAppointments(filter: AppointmentFilter = 'upcoming'): Promise<AppointmentsApiResponse> {
    try {
      return await this.repository.getAppointments(filter);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentWithRelations> {
    try {
      return await this.repository.getAppointmentById(appointmentId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getLastVetForPet(petId: string): Promise<string | null> {
    try {
      return await this.repository.getLastVetForPet(petId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createAppointment(appointmentData: AppointmentFormData): Promise<AppointmentWithRelations> {
    try {
      // Business validation
      this.validator.validateAppointmentData(appointmentData, false);
      
      // Transform data
      const transformedData = this.validator.transformAppointmentData(appointmentData) as AppointmentFormData;
      
      return await this.repository.createAppointment(transformedData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAppointment(
    appointmentId: string,
    appointmentData: Partial<AppointmentFormData>
  ): Promise<AppointmentWithRelations> {
    try {
      // Business validation
      this.validator.validateAppointmentData(appointmentData, true);
      
      // Transform data
      const transformedData = this.validator.transformAppointmentData(appointmentData);
      
      return await this.repository.updateAppointment(appointmentId, transformedData);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateVisitNotes(appointmentId: string, visitNotes: string): Promise<AppointmentWithRelations> {
    try {
      // Validate notes length
      this.validator.validateAppointmentData({ visitNotes }, true);
      
      return await this.repository.updateVisitNotes(appointmentId, visitNotes.trim());
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      await this.repository.deleteAppointment(appointmentId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  private handleError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }
    if (error instanceof Error) {
      return new ApiError(error.message, 500, 'APPOINTMENT_ERROR');
    }
    return new ApiError('An unexpected error occurred', 500, 'APPOINTMENT_ERROR');
  }

  mapError(error: unknown): AppointmentError {
    let message = 'An error occurred while processing your request';
    let field: keyof AppointmentFormData | undefined;
    let code = 'APPOINTMENT_ERROR';

    if (error instanceof ValidationError) {
      message = error.message;
      field = error.field as keyof AppointmentFormData;
      code = 'VALIDATION_ERROR';
    } else if (error instanceof NotFoundError) {
      message = 'Appointment not found';
      code = 'NOT_FOUND';
    } else if (error instanceof UnauthorizedError) {
      message = 'You must be logged in to perform this action';
      code = 'UNAUTHORIZED';
    } else if (error instanceof ForbiddenError) {
      message = 'You do not have permission to perform this action';
      code = 'FORBIDDEN';
    } else if (error instanceof ApiError) {
      message = error.message;
      code = error.code || 'API_ERROR';
    } else if (error instanceof Error) {
      message = error.message;
    }

    // Map specific validation errors to fields (enhanced from validator errors)
    if (message.toLowerCase().includes('pet') && !message.toLowerCase().includes('vet')) {
      field = 'petId';
      code = 'INVALID_PET';
    } else if (message.toLowerCase().includes('vet') || message.toLowerCase().includes('veterinarian')) {
      field = 'veterinarianId';
      code = 'INVALID_VETERINARIAN';
    } else if (message.toLowerCase().includes('date') && !message.toLowerCase().includes('time')) {
      field = 'appointmentDate';
      code = 'INVALID_DATE';
    } else if (message.toLowerCase().includes('time')) {
      field = 'appointmentTime';
      code = 'INVALID_TIME';
    } else if (message.toLowerCase().includes('type')) {
      field = 'appointmentType';
      code = 'INVALID_TYPE';
    } else if (message.toLowerCase().includes('reason')) {
      field = 'reasonForVisit';
      code = 'INVALID_REASON';
    } else if (message.toLowerCase().includes('notes')) {
      field = 'visitNotes';
      code = 'INVALID_NOTES';
    }

    return { message, field, code };
  }
}