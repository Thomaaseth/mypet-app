import type { AppointmentWithRelations, AppointmentFormData } from '@/types/appointments';

export interface AppointmentsApiResponse {
  appointments: AppointmentWithRelations[];
  total: number;
}

export interface AppointmentApiResponse {
  appointment: AppointmentWithRelations;
}

export interface AppointmentError {
  message: string;
  field?: keyof AppointmentFormData;
  code: string;
}