import { z } from 'zod';

// Appointment type enum values (must match database enum)
export const appointmentTypes = [
  'checkup',
  'vaccination',
  'surgery',
  'dental',
  'grooming',
  'emergency',
  'other',
] as const;

export type AppointmentType = typeof appointmentTypes[number];

// Helper function to get today's date in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to validate time format (HH:MM in 24h format)
const isValidTime = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

// Helper function to check if time is in 5-minute increments
const isValid5MinuteIncrement = (time: string): boolean => {
  if (!isValidTime(time)) return false;
  const [, minutes] = time.split(':');
  const minuteValue = parseInt(minutes, 10);
  return minuteValue % 5 === 0;
};

// Base appointment form schema
export const appointmentFormSchema = z.object({
  petId: z.string()
    .uuid('Invalid pet ID'),
  
  veterinarianId: z.string()
    .uuid('Invalid veterinarian ID'),
  
  appointmentDate: z.string()
    .min(1, 'Date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date'),
  
  appointmentTime: z.string()
    .min(1, 'Time is required')
    .refine(isValidTime, 'Please enter a valid time (HH:MM in 24-hour format)')
    .refine(isValid5MinuteIncrement, 'Time must be in 5-minute increments (e.g., 14:05, 14:10)'),
  
  appointmentType: z.enum(appointmentTypes, {
    required_error: 'Please select an appointment type',
    invalid_type_error: 'Invalid appointment type',
  }),
  
  reasonForVisit: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  visitNotes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

// Schema for creating a new appointment (validates date is not in the past)
export const createAppointmentSchema = appointmentFormSchema.refine(
  (data) => {
    const appointmentDate = new Date(data.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today;
  },
  {
    message: 'Appointment date cannot be in the past',
    path: ['appointmentDate'],
  }
);

// Schema for updating an appointment (full edit for upcoming, notes only for past)
export const updateAppointmentSchema = appointmentFormSchema.extend({
  id: z.string().uuid('Invalid appointment ID'),
});

// Schema for updating only visit notes (for past appointments)
export const updateVisitNotesSchema = z.object({
  visitNotes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

// Types inferred from schemas
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>;
export type UpdateVisitNotesData = z.infer<typeof updateVisitNotesSchema>;

// Validation functions for backend use
export const validateCreateAppointment = (data: unknown) => {
  return createAppointmentSchema.safeParse(data);
};

export const validateUpdateAppointment = (data: unknown) => {
  return updateAppointmentSchema.safeParse(data);
};

export const validateUpdateVisitNotes = (data: unknown) => {
  return updateVisitNotesSchema.safeParse(data);
};

// Date formatting utilities
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Time formatting utilities
export const formatTimeForDisplay = (timeString: string): string => {
  // timeString is already in HH:MM format (24h)
  return timeString.slice(0, 5); // Remove seconds if present (HH:MM:SS -> HH:MM)
};

export const formatTimeForInput = (timeString: string): string => {
  // Ensure HH:MM format for input
  return timeString.slice(0, 5);
};

// Generate time options for dropdown (5-minute increments, 24h format)
export const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      options.push(`${hourStr}:${minuteStr}`);
    }
  }
  return options;
};

// Helper to check if appointment is upcoming or past
export const isUpcomingAppointment = (appointmentDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(appointmentDate);
  apptDate.setHours(0, 0, 0, 0);
  return apptDate >= today;
};