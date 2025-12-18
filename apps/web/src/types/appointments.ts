import type { Pet } from './pet';
import type { Veterinarian } from './veterinarian';

// Appointment type enum (matches backend and validation)
export type AppointmentType = 
  | 'checkup' 
  | 'vaccination' 
  | 'surgery' 
  | 'dental' 
  | 'grooming' 
  | 'emergency' 
  | 'other';
  // add others if necessary

// Main appointment interface
export interface Appointment {
  id: string;
  userId: string;
  petId: string;
  veterinarianId: string;
  appointmentDate: string; // YYYY-MM-DD format
  appointmentTime: string; // HH:MM:SS format (from database)
  appointmentType: AppointmentType;
  reasonForVisit: string | null;
  visitNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Extended appointment with relations (returned from API with `with` clause)
export interface AppointmentWithRelations extends Appointment {
  pet: Pet;
  veterinarian: Veterinarian;
}

// Form data types
export interface AppointmentFormData {
  petId: string;
  veterinarianId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM (24h format, no seconds)
  appointmentType: AppointmentType;
  reasonForVisit?: string;
  visitNotes?: string;
}

// Update visit notes only (for past appointments)
export interface UpdateVisitNotesData {
  visitNotes?: string;
}

// API response types
export interface AppointmentsApiResponse {
  appointments: AppointmentWithRelations[];
  total: number;
}

export interface AppointmentApiResponse {
  appointment: AppointmentWithRelations;
}

export interface LastVetApiResponse {
  veterinarianId: string | null;
}

// Error types
export interface AppointmentError {
  message: string;
  field?: keyof AppointmentFormData;
  code?: string;
}

// Helper type for filter
export type AppointmentFilter = 'upcoming' | 'past';

// Display format helpers (used in components)
export interface AppointmentDisplay {
  id: string;
  petName: string;
  petId: string;
  vetName: string;
  clinicName: string | null;
  date: string; // Display format: "Wednesday, December 25, 2025"
  time: string; // Display format: "14:30"
  type: AppointmentType;
  typeBadgeText: string;
  reasonForVisit: string | null;
  visitNotes: string | null;
  isUpcoming: boolean;
}