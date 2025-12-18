import { AppointmentService } from './service';
import { appointmentRepository } from './repository';
import { appointmentValidator } from './validator';
import type { AppointmentFormData, AppointmentFilter } from '@/types/appointments';

// Create configured service instance
const appointmentService = new AppointmentService(appointmentRepository, appointmentValidator);

// Export the same interface pattern as other APIs
export const appointmentApi = {
  getAppointments: (filter: AppointmentFilter = 'upcoming') => 
    appointmentService.getAppointments(filter),
  getAppointmentById: (appointmentId: string) => 
    appointmentService.getAppointmentById(appointmentId),
  getLastVetForPet: (petId: string) => 
    appointmentService.getLastVetForPet(petId),
  createAppointment: (appointmentData: AppointmentFormData) => 
    appointmentService.createAppointment(appointmentData),
  updateAppointment: (appointmentId: string, appointmentData: Partial<AppointmentFormData>) => 
    appointmentService.updateAppointment(appointmentId, appointmentData),
  updateVisitNotes: (appointmentId: string, visitNotes: string) => 
    appointmentService.updateVisitNotes(appointmentId, visitNotes),
  deleteAppointment: (appointmentId: string) => 
    appointmentService.deleteAppointment(appointmentId),
};

// Export the error handler interface
export const appointmentErrorHandler = (error: unknown) => appointmentService.mapError(error);

// Export types for consumers
export type { AppointmentsApiResponse, AppointmentError } from './types';

// Export individual components for testing or advanced use
export { AppointmentRepository } from './repository';
export { AppointmentValidator } from './validator';
export { AppointmentService } from './service';