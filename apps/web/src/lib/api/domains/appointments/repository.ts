import { get, post, put, patch, del } from '../../base';
import type { 
  AppointmentsApiResponse,
  AppointmentWithRelations,
  AppointmentFormData,
  UpdateVisitNotesData,
  LastVetApiResponse,
  AppointmentFilter,
} from '@/types/appointments';

// Handles data access operations using existing API functions
export class AppointmentRepository {
  async getAppointments(filter: AppointmentFilter = 'upcoming'): Promise<AppointmentsApiResponse> {
    return await get<AppointmentsApiResponse>('/api/appointments', { filter });
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentWithRelations> {
    const result = await get<{ appointment: AppointmentWithRelations }>(
      `/api/appointments/${appointmentId}`
    );
    return result.appointment;
  }

  async getLastVetForPet(petId: string): Promise<string | null> {
    const result = await get<LastVetApiResponse>(`/api/appointments/last-vet/${petId}`);
    return result.veterinarianId;
  }

  async createAppointment(appointmentData: AppointmentFormData): Promise<AppointmentWithRelations> {
    const result = await post<{ appointment: AppointmentWithRelations }, AppointmentFormData>(
      '/api/appointments',
      appointmentData
    );
    return result.appointment;
  }

  async updateAppointment(
    appointmentId: string,
    appointmentData: Partial<AppointmentFormData>
  ): Promise<AppointmentWithRelations> {
    const result = await put<{ appointment: AppointmentWithRelations }, Partial<AppointmentFormData>>(
      `/api/appointments/${appointmentId}`,
      appointmentData
    );
    return result.appointment;
  }

  async updateVisitNotes(
    appointmentId: string,
    visitNotes: string
  ): Promise<AppointmentWithRelations> {
    const result = await patch<{ appointment: AppointmentWithRelations }, UpdateVisitNotesData>(
      `/api/appointments/${appointmentId}/notes`,
      { visitNotes }
    );
    return result.appointment;
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    await del<{ message: string }>(`/api/appointments/${appointmentId}`);
  }
}

// Default repository instance
export const appointmentRepository = new AppointmentRepository();