import type { AppointmentFormData } from '@/types/appointments';
import { ValidationError } from '../../errors';

export class AppointmentValidator {
  validateAppointmentData(data: Partial<AppointmentFormData>, isUpdate: boolean = false): void {
    // Required fields for creation
    if (!isUpdate) {
      this.validatePetId(data.petId);
      this.validateVeterinarianId(data.veterinarianId);
      this.validateDate(data.appointmentDate);
      this.validateTime(data.appointmentTime);
      this.validateType(data.appointmentType);
    } else {
      // Optional validation for updates
      if (data.petId !== undefined) this.validatePetId(data.petId);
      if (data.veterinarianId !== undefined) this.validateVeterinarianId(data.veterinarianId);
      if (data.appointmentDate !== undefined) this.validateDate(data.appointmentDate);
      if (data.appointmentTime !== undefined) this.validateTime(data.appointmentTime);
      if (data.appointmentType !== undefined) this.validateType(data.appointmentType);
    }

    // Optional fields
    if (data.reasonForVisit !== undefined) this.validateReasonForVisit(data.reasonForVisit);
    if (data.visitNotes !== undefined) this.validateVisitNotes(data.visitNotes);
  }

  private validatePetId(petId?: string): void {
    if (!petId || petId.trim().length === 0) {
      throw new ValidationError('Pet is required', 'petId');
    }
    // UUID format validation
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // if (!uuidRegex.test(petId)) {
    //   throw new ValidationError('Invalid pet ID format', 'petId');
    // }
  }

  private validateVeterinarianId(vetId?: string): void {
    if (!vetId || vetId.trim().length === 0) {
      throw new ValidationError('Veterinarian is required', 'veterinarianId');
    }
    // UUID format validation
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // if (!uuidRegex.test(vetId)) {
    //   throw new ValidationError('Invalid veterinarian ID format', 'veterinarianId');
    // }
  }

  private validateDate(appointmentDate?: string): void {
    if (!appointmentDate || appointmentDate.trim().length === 0) {
      throw new ValidationError('Appointment date is required', 'appointmentDate');
    }

    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      throw new ValidationError('Please enter a valid date', 'appointmentDate');
    }

    // Check if date is in proper YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointmentDate)) {
      throw new ValidationError('Date must be in YYYY-MM-DD format', 'appointmentDate');
    }
  }

  private validateTime(appointmentTime?: string): void {
    if (!appointmentTime || appointmentTime.trim().length === 0) {
      throw new ValidationError('Appointment time is required', 'appointmentTime');
    }

    // HH:MM format validation (24-hour)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(appointmentTime)) {
      throw new ValidationError('Time must be in HH:MM format (24-hour)', 'appointmentTime');
    }

    // Check if time is in 5-minute increments
    const [, minutes] = appointmentTime.split(':');
    const minuteValue = parseInt(minutes, 10);
    if (minuteValue % 5 !== 0) {
      throw new ValidationError('Time must be in 5-minute increments (e.g., 14:05, 14:10)', 'appointmentTime');
    }
  }

  private validateType(appointmentType?: string): void {
    if (!appointmentType || appointmentType.trim().length === 0) {
      throw new ValidationError('Appointment type is required', 'appointmentType');
    }

    const validTypes = ['checkup', 'vaccination', 'surgery', 'dental', 'grooming', 'emergency', 'other'];
    if (!validTypes.includes(appointmentType)) {
      throw new ValidationError('Invalid appointment type', 'appointmentType');
    }
  }

  private validateReasonForVisit(reason?: string): void {
    if (!reason || reason.trim() === '') return; // Optional

    if (reason.length > 500) {
      throw new ValidationError('Reason for visit cannot exceed 500 characters', 'reasonForVisit');
    }
  }

  private validateVisitNotes(notes?: string): void {
    if (!notes || notes.trim() === '') return; // Optional

    if (notes.length > 1000) {
      throw new ValidationError('Visit notes cannot exceed 1000 characters', 'visitNotes');
    }
  }

  transformAppointmentData(data: Partial<AppointmentFormData>): Partial<AppointmentFormData> {
    const transformed = { ...data };

    // Trim string fields
    if (transformed.petId) transformed.petId = transformed.petId.trim();
    if (transformed.veterinarianId) transformed.veterinarianId = transformed.veterinarianId.trim();
    if (transformed.appointmentDate) transformed.appointmentDate = transformed.appointmentDate.trim();
    if (transformed.appointmentTime) transformed.appointmentTime = transformed.appointmentTime.trim();
    if (transformed.appointmentType) transformed.appointmentType = transformed.appointmentType.trim() as any;
    if (transformed.reasonForVisit) transformed.reasonForVisit = transformed.reasonForVisit.trim();
    if (transformed.visitNotes) transformed.visitNotes = transformed.visitNotes.trim();

    return transformed;
  }
}

// Default validator instance
export const appointmentValidator = new AppointmentValidator();