import type { AppointmentFormData } from '@/types/appointments';


export interface AppointmentError {
  message: string;
  field?: keyof AppointmentFormData;
  code: string;
}