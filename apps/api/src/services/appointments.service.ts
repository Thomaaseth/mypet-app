import { db } from '../db';
import { appointments } from '../db/schema/appointments';
import { eq, and, gte, lt, desc, asc } from 'drizzle-orm';
import type { Appointment, NewAppointment, AppointmentType } from '../db/schema/appointments';
import { 
  BadRequestError, 
  NotFoundError 
} from '../middleware/errors';
import { dbLogger } from '../lib/logger';
import { PetsService } from './pets.service';
import { VeterinariansService } from './veterinarians.service';

// Type for appointment form data (matches validation schema)
export interface AppointmentFormData {
  petId: string;
  veterinarianId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  appointmentType: AppointmentType;
  reasonForVisit?: string;
  visitNotes?: string;
}

export class AppointmentsService {
  // UUID validation helper
  private static validateUUID(id: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new BadRequestError(`Invalid ${fieldName} format`);
    }
  }

  // Verify pet ownership (reuse pattern from other services)
  private static async verifyPetOwnership(petId: string, userId: string): Promise<void> {
    try {
      await PetsService.getPetById(petId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Pet not found or access denied');
      }
      throw error;
    }
  }

  // Verify vet ownership and pet-vet assignment
  private static async verifyVetAssignment(
    vetId: string, 
    petId: string, 
    userId: string
  ): Promise<void> {
    try {
      // Verify vet belongs to user
      await VeterinariansService.getVeterinarianById(vetId, userId);
      
      // Verify vet is assigned to the pet
      const assignedPets = await VeterinariansService.getVetPets(vetId, userId);
      const isAssigned = assignedPets.some(assignment => assignment.petId === petId);
      
      if (!isAssigned) {
        throw new BadRequestError('This veterinarian is not assigned to the selected pet');
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Veterinarian not found or access denied');
      }
      throw error;
    }
  }

  // Input validation helper
  private static validateAppointmentInputs(
    appointmentData: Partial<AppointmentFormData>, 
    isUpdate = false
  ): void {
    // Required fields for creation
    if (!isUpdate) {
      if (!appointmentData.petId) {
        throw new BadRequestError('Pet ID is required');
      }
      if (!appointmentData.veterinarianId) {
        throw new BadRequestError('Veterinarian ID is required');
      }
      if (!appointmentData.appointmentDate) {
        throw new BadRequestError('Appointment date is required');
      }
      if (!appointmentData.appointmentTime) {
        throw new BadRequestError('Appointment time is required');
      }
      if (!appointmentData.appointmentType) {
        throw new BadRequestError('Appointment type is required');
      }
    }

    // Date validation (if provided)
    if (appointmentData.appointmentDate !== undefined) {
      const appointmentDate = new Date(appointmentData.appointmentDate);
      if (isNaN(appointmentDate.getTime())) {
        throw new BadRequestError('Invalid date format');
      }

      // For new appointments only, check if date is not in the past
      if (!isUpdate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        appointmentDate.setHours(0, 0, 0, 0);
        
        if (appointmentDate < today) {
          throw new BadRequestError('Appointment date cannot be in the past');
        }
      }
    }

    // Time validation (if provided)
    if (appointmentData.appointmentTime !== undefined) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(appointmentData.appointmentTime)) {
        throw new BadRequestError('Invalid time format (use HH:MM in 24-hour format)');
      }

      // Check if time is in 5-minute increments
      const [, minutes] = appointmentData.appointmentTime.split(':');
      const minuteValue = parseInt(minutes, 10);
      if (minuteValue % 5 !== 0) {
        throw new BadRequestError('Time must be in 5-minute increments');
      }
    }

    // Appointment type validation
    if (appointmentData.appointmentType !== undefined) {
      const validTypes: AppointmentType[] = [
        'checkup', 'vaccination', 'surgery', 'dental', 'grooming', 'emergency', 'other'
      ];
      if (!validTypes.includes(appointmentData.appointmentType)) {
        throw new BadRequestError('Invalid appointment type');
      }
    }

    // Notes length validation
    if (appointmentData.reasonForVisit !== undefined && appointmentData.reasonForVisit !== null) {
      if (appointmentData.reasonForVisit.length > 500) {
        throw new BadRequestError('Reason for visit must be less than 500 characters');
      }
    }

    if (appointmentData.visitNotes !== undefined && appointmentData.visitNotes !== null) {
      if (appointmentData.visitNotes.length > 1000) {
        throw new BadRequestError('Visit notes must be less than 1000 characters');
      }
    }
  }

  // Check for duplicate appointments
  private static async checkDuplicateAppointment(
    petId: string,
    veterinarianId: string,
    appointmentDate: string,
    appointmentTime: string,
    excludeAppointmentId?: string
  ): Promise<void> {
    const conditions = [
      eq(appointments.petId, petId),
      eq(appointments.veterinarianId, veterinarianId),
      eq(appointments.appointmentDate, appointmentDate),
      eq(appointments.appointmentTime, `${appointmentTime}:00`) // Add seconds
    ];

    // Exclude current appointment when updating
    if (excludeAppointmentId) {
      // We'll check this in the update method instead
      return;
    }

    const existingAppointment = await db.query.appointments.findFirst({
      where: and(...conditions),
    });

    if (existingAppointment) {
      throw new BadRequestError(
        'An appointment already exists for this pet with this veterinarian at this date and time'
      );
    }
  }

  // GET all appointments for a user (with filter)
  static async getAppointments(
    userId: string, 
    filter: 'upcoming' | 'past' = 'upcoming'
  ): Promise<Appointment[]> {
    try {
      this.validateUUID(userId, 'user ID');

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      let appointmentsList: Appointment[];

      if (filter === 'upcoming') {
        // Upcoming: appointmentDate >= today
        appointmentsList = await db.query.appointments.findMany({
          where: and(
            eq(appointments.userId, userId),
            gte(appointments.appointmentDate, today)
          ),
          orderBy: [asc(appointments.appointmentDate), asc(appointments.appointmentTime)],
          with: {
            pet: true,
            veterinarian: true,
          },
        });
      } else {
        // Past: appointmentDate < today
        appointmentsList = await db.query.appointments.findMany({
          where: and(
            eq(appointments.userId, userId),
            lt(appointments.appointmentDate, today)
          ),
          orderBy: [desc(appointments.appointmentDate), desc(appointments.appointmentTime)],
          with: {
            pet: true,
            veterinarian: true,
          },
        });
      }

      dbLogger.info({ userId, filter, count: appointmentsList.length }, 'Appointments retrieved');
      return appointmentsList;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error, userId }, 'Error fetching appointments');
      throw new BadRequestError('Failed to fetch appointments');
    }
  }

  // GET single appointment by ID
  static async getAppointmentById(appointmentId: string, userId: string): Promise<Appointment> {
    try {
      this.validateUUID(appointmentId, 'appointment ID');
      this.validateUUID(userId, 'user ID');

      const appointment = await db.query.appointments.findFirst({
        where: and(
          eq(appointments.id, appointmentId),
          eq(appointments.userId, userId)
        ),
        with: {
          pet: true,
          veterinarian: true,
        },
      });

      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      return appointment;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error, appointmentId }, 'Error fetching appointment');
      throw new BadRequestError('Failed to fetch appointment');
    }
  }

  // GET last vet used for a specific pet
  static async getLastVetForPet(petId: string, userId: string): Promise<string | null> {
    try {
      this.validateUUID(petId, 'pet ID');
      this.validateUUID(userId, 'user ID');

      // Verify pet ownership
      await this.verifyPetOwnership(petId, userId);

      const lastAppointment = await db.query.appointments.findFirst({
        where: and(
          eq(appointments.petId, petId),
          eq(appointments.userId, userId)
        ),
        orderBy: [desc(appointments.appointmentDate), desc(appointments.appointmentTime)],
        columns: {
          veterinarianId: true,
        },
      });

      return lastAppointment?.veterinarianId || null;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error, petId }, 'Error fetching last vet for pet');
      throw new BadRequestError('Failed to fetch last vet');
    }
  }

  // CREATE new appointment
  static async createAppointment(
    appointmentData: AppointmentFormData,
    userId: string
  ): Promise<Appointment> {
    try {
      this.validateUUID(userId, 'user ID');
      this.validateAppointmentInputs(appointmentData, false);

      // Verify pet ownership
      await this.verifyPetOwnership(appointmentData.petId, userId);

      // Verify vet ownership and assignment
      await this.verifyVetAssignment(
        appointmentData.veterinarianId, 
        appointmentData.petId, 
        userId
      );

      // Check for duplicate appointments
      await this.checkDuplicateAppointment(
        appointmentData.petId,
        appointmentData.veterinarianId,
        appointmentData.appointmentDate,
        appointmentData.appointmentTime
      );

      // Prepare data for insertion
      const newAppointmentData: NewAppointment = {
        userId,
        petId: appointmentData.petId,
        veterinarianId: appointmentData.veterinarianId,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: `${appointmentData.appointmentTime}:00`, // Add seconds for TIME type
        appointmentType: appointmentData.appointmentType,
        reasonForVisit: appointmentData.reasonForVisit || null,
        visitNotes: appointmentData.visitNotes || null,
      };

      // Insert appointment
      const [newAppointment] = await db
        .insert(appointments)
        .values(newAppointmentData)
        .returning();

      dbLogger.info({ appointmentId: newAppointment.id }, 'Appointment created successfully');
      
      // Fetch with relations
      return await this.getAppointmentById(newAppointment.id, userId);
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error creating appointment');
      throw new BadRequestError('Failed to create appointment');
    }
  }

  // UPDATE appointment (full edit for upcoming, notes only for past)
  static async updateAppointment(
    appointmentId: string,
    updateData: Partial<AppointmentFormData>,
    userId: string
  ): Promise<Appointment> {
    try {
      this.validateUUID(appointmentId, 'appointment ID');
      this.validateUUID(userId, 'user ID');
      this.validateAppointmentInputs(updateData, true);

      // Fetch existing appointment
      const existingAppointment = await this.getAppointmentById(appointmentId, userId);

      // Check if appointment is in the past
      const today = new Date().toISOString().split('T')[0];
      const isPastAppointment = existingAppointment.appointmentDate < today;

      // If past appointment, only allow visitNotes update
      if (isPastAppointment) {
        if (Object.keys(updateData).some(key => 
          key !== 'visitNotes' && updateData[key as keyof AppointmentFormData] !== undefined
        )) {
          throw new BadRequestError('Cannot modify past appointments except for visit notes');
        }
      }

      // Verify pet ownership if petId is being updated
      if (updateData.petId) {
        await this.verifyPetOwnership(updateData.petId, userId);
      }

      // Verify vet assignment if vetId or petId is being updated
      if (updateData.veterinarianId || updateData.petId) {
        const vetId = updateData.veterinarianId || existingAppointment.veterinarianId;
        const petId = updateData.petId || existingAppointment.petId;
        await this.verifyVetAssignment(vetId, petId, userId);
      }

      // Check for duplicate if date/time/pet/vet changed
      if (updateData.appointmentDate || updateData.appointmentTime || 
          updateData.petId || updateData.veterinarianId) {
        await this.checkDuplicateAppointment(
          updateData.petId || existingAppointment.petId,
          updateData.veterinarianId || existingAppointment.veterinarianId,
          updateData.appointmentDate || existingAppointment.appointmentDate,
          updateData.appointmentTime || existingAppointment.appointmentTime.slice(0, 5),
          appointmentId
        );
      }

      // Prepare update data (handle empty strings as null)
      const cleanedData: Partial<Appointment> = {
        ...(updateData.petId && { petId: updateData.petId }),
        ...(updateData.veterinarianId && { veterinarianId: updateData.veterinarianId }),
        ...(updateData.appointmentDate && { appointmentDate: updateData.appointmentDate }),
        ...(updateData.appointmentTime && { appointmentTime: `${updateData.appointmentTime}:00` }),
        ...(updateData.appointmentType && { appointmentType: updateData.appointmentType }),
        reasonForVisit: updateData.reasonForVisit === '' ? null : 
          (updateData.reasonForVisit !== undefined ? updateData.reasonForVisit : existingAppointment.reasonForVisit),
        visitNotes: updateData.visitNotes === '' ? null : 
          (updateData.visitNotes !== undefined ? updateData.visitNotes : existingAppointment.visitNotes),
      };

      // Execute update
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          ...cleanedData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.userId, userId)
        ))
        .returning();

      if (!updatedAppointment) {
        throw new NotFoundError('Appointment not found');
      }

      dbLogger.info({ appointmentId }, 'Appointment updated successfully');
      return await this.getAppointmentById(appointmentId, userId);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error, appointmentId }, 'Error updating appointment');
      throw new BadRequestError('Failed to update appointment');
    }
  }

  // UPDATE visit notes only (for past appointments)
  static async updateVisitNotes(
    appointmentId: string,
    visitNotes: string,
    userId: string
  ): Promise<Appointment> {
    try {
      this.validateUUID(appointmentId, 'appointment ID');
      this.validateUUID(userId, 'user ID');

      if (visitNotes.length > 1000) {
        throw new BadRequestError('Visit notes must be less than 1000 characters');
      }

      // Verify appointment exists and user owns it
      await this.getAppointmentById(appointmentId, userId);

      // Update only visitNotes
      const [updatedAppointment] = await db
        .update(appointments)
        .set({
          visitNotes: visitNotes === '' ? null : visitNotes,
          updatedAt: new Date(),
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.userId, userId)
        ))
        .returning();

      if (!updatedAppointment) {
        throw new NotFoundError('Appointment not found');
      }

      dbLogger.info({ appointmentId }, 'Visit notes updated successfully');
      return await this.getAppointmentById(appointmentId, userId);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error, appointmentId }, 'Error updating visit notes');
      throw new BadRequestError('Failed to update visit notes');
    }
  }

  // DELETE appointment (hard delete)
  static async deleteAppointment(appointmentId: string, userId: string): Promise<void> {
    try {
      this.validateUUID(appointmentId, 'appointment ID');
      this.validateUUID(userId, 'user ID');

      // Verify appointment exists and user owns it
      await this.getAppointmentById(appointmentId, userId);

      // Execute delete
      const result = await db
        .delete(appointments)
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.userId, userId)
        ))
        .returning();

      if (!result.length) {
        throw new NotFoundError('Appointment not found');
      }

      dbLogger.info({ appointmentId }, 'Appointment deleted successfully');
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error, appointmentId }, 'Error deleting appointment');
      throw new BadRequestError('Failed to delete appointment');
    }
  }
}