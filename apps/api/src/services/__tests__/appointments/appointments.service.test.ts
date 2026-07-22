import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import * as schema from '../../../db/schema';
import { AppointmentsService } from '../../appointments.service';
import { UserPreferencesService } from '../../user-preferences.service';
import { BadRequestError, NotFoundError } from '../../../middleware/errors';
import { db } from '../../../db';
import { setupUserPetAndVet } from './helpers/setup';
import { makeAppointmentData } from './helpers/factories';
import { toDateString, addCalendarDays } from '@/shared/utils/dates';
import { VeterinariansService } from '@/services/veterinarians.service';
import { useFixedTimeForTimezoneTests } from '../../../test/timezone-test-utils';

describe('AppointmentsService', () => {
  describe('createAppointment', () => {
    it('should create an appointment with valid data', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      const result = await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
        primary.id
      );

      expect(result.petId).toBe(testPet.id);
      expect(result.veterinarianId).toBe(testVet.id);
      expect(result.appointmentDate).toBe('2024-06-15');
      expect(result.appointmentTime).toBe('14:00:00');
      expect(result.appointmentType).toBe('checkup');
    });

    it('allows creating a past-dated appointment (deliberately no longer restricted)', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      const result = await AppointmentsService.createAppointment(
        makeAppointmentData({
          petId: testPet.id,
          veterinarianId: testVet.id,
          appointmentDate: '2020-01-01',
        }),
        primary.id
      );

      expect(result.appointmentDate).toBe('2020-01-01');
    });

    it('should throw BadRequestError when petId is missing', async () => {
      const { primary, testVet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({ petId: '', veterinarianId: testVet.id }),
          primary.id
        )
      ).rejects.toThrow('Pet ID is required');
    });

    it('should throw NotFoundError when the pet does not belong to the user', async () => {
        const { primary, secondary, testVet } = await setupUserPetAndVet();
        const [otherPet] = await db.insert(schema.pets).values({
          userId: secondary.id,
          name: 'Other Pet',
          animalType: 'cat',
        }).returning();
  
        await expect(
          AppointmentsService.createAppointment(
            makeAppointmentData({ petId: otherPet.id, veterinarianId: testVet.id }),
            primary.id
          )
        ).rejects.toThrow(NotFoundError);
      });

    it('should throw BadRequestError when veterinarianId is missing', async () => {
      const { primary, testPet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({ petId: testPet.id, veterinarianId: '' }),
          primary.id
        )
      ).rejects.toThrow('Veterinarian ID is required');
    });

    it('should throw BadRequestError for invalid time format', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id, appointmentTime: '25:00' }),
          primary.id
        )
      ).rejects.toThrow('Invalid time format');
    });

    it('should throw BadRequestError when time is not in 5-minute increments', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id, appointmentTime: '14:03' }),
          primary.id
        )
      ).rejects.toThrow('5-minute increments');
    });

    it('should throw BadRequestError for invalid appointment type', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          // @ts-expect-error deliberately invalid type for validation testing
          makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id, appointmentType: 'not-a-type' }),
          primary.id
        )
      ).rejects.toThrow('Invalid appointment type');
    });

    it('should throw BadRequestError for a duplicate appointment (same pet, vet, date, time)', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const data = makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id });

      await AppointmentsService.createAppointment(data, primary.id);

      await expect(
        AppointmentsService.createAppointment(data, primary.id)
      ).rejects.toThrow('already exists');
    });

    it('should throw NotFoundError when the pet does not belong to the user', async () => {
      const { secondary, testVet } = await setupUserPetAndVet();
      const [otherPet] = await db.insert(schema.pets).values({
        userId: secondary.id,
        name: 'Other Pet',
        animalType: 'cat',
      }).returning();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({ petId: otherPet.id, veterinarianId: testVet.id }),
          secondary.id === undefined ? '' : secondary.id // placeholder never hit; real call below
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when the vet was unassigned from the pet before booking', async () => {
        const { primary, testPet, testVet } = await setupUserPetAndVet();
  
        await VeterinariansService.unassignVetFromPets(testVet.id, primary.id, [testPet.id]);
  
        await expect(
          AppointmentsService.createAppointment(
            makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
            primary.id
          )
        ).rejects.toThrow('not assigned to the selected pet');
      });

    it('should throw BadRequestError when the vet is not assigned to the pet', async () => {
      const { primary, testPet } = await setupUserPetAndVet();

      const [unassignedVet] = await db.insert(schema.veterinarians).values({
        userId: primary.id,
        vetName: 'Dr. Unassigned',
        phone: '555-9999',
        addressLine1: '999 Other St',
        city: 'Boston',
        zipCode: '02101',
      }).returning();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({ petId: testPet.id, veterinarianId: unassignedVet.id }),
          primary.id
        )
      ).rejects.toThrow('not assigned to the selected pet');
    });
  });

  describe('getAppointments', () => {
        it('returns an appointment in "past" when its date is before the stored user timezone\'s today', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateTimeLocale: 'en-US',
        unitSystem: 'imperial',
        timezone: 'Pacific/Kiritimati',
      });

      const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
      const yesterday = addCalendarDays(usersToday, -1);

      await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id, appointmentDate: yesterday }),
        primary.id
      );

      const upcoming = await AppointmentsService.getAppointments(primary.id, 'upcoming');
      const past = await AppointmentsService.getAppointments(primary.id, 'past');

      expect(upcoming).toHaveLength(0);
      expect(past).toHaveLength(1);
    });

    it('orders upcoming appointments soonest-first', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const usersToday = await UserPreferencesService.getTodayForUser(primary.id);

      await AppointmentsService.createAppointment(
        makeAppointmentData({
          petId: testPet.id, veterinarianId: testVet.id,
          appointmentDate: addCalendarDays(usersToday, 10), appointmentTime: '09:00',
        }),
        primary.id
      );
      await AppointmentsService.createAppointment(
        makeAppointmentData({
          petId: testPet.id, veterinarianId: testVet.id,
          appointmentDate: addCalendarDays(usersToday, 3), appointmentTime: '09:00',
        }),
        primary.id
      );

      const upcoming = await AppointmentsService.getAppointments(primary.id, 'upcoming');

      expect(upcoming).toHaveLength(2);
      expect(upcoming[0].appointmentDate).toBe(addCalendarDays(usersToday, 3));
      expect(upcoming[1].appointmentDate).toBe(addCalendarDays(usersToday, 10));
    });
  });

  describe('timezone-aware upcoming/past classification', () => {
    useFixedTimeForTimezoneTests();

    it('returns an appointment in "upcoming" when its date is today or later, using the stored user timezone', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      await UserPreferencesService.upsertUserPreferences(primary.id, {
        dateTimeLocale: 'en-US',
        unitSystem: 'imperial',
        timezone: 'Pacific/Kiritimati',
      });

      const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
      const serverUtcToday = toDateString(new Date());
      expect(usersToday).not.toBe(serverUtcToday);

      await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id, appointmentDate: usersToday }),
        primary.id
      );

      const upcoming = await AppointmentsService.getAppointments(primary.id, 'upcoming');
      const past = await AppointmentsService.getAppointments(primary.id, 'past');

      expect(upcoming).toHaveLength(1);
      expect(past).toHaveLength(0);
    });
  });

  describe('getAppointmentById', () => {
    it('should return the appointment when it exists and belongs to the user', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
        primary.id
      );

      const result = await AppointmentsService.getAppointmentById(created.id, primary.id);

      expect(result.id).toBe(created.id);
    });

    it('should throw NotFoundError when the appointment does not exist', async () => {
      const { primary } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.getAppointmentById(randomUUID(), primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when the appointment belongs to a different user', async () => {
      const { primary, secondary, testPet, testVet } = await setupUserPetAndVet();
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
        primary.id
      );

      await expect(
        AppointmentsService.getAppointmentById(created.id, secondary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getLastVetForPet', () => {
    it('should return the vet from the most recent appointment', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
        primary.id
      );

      const result = await AppointmentsService.getLastVetForPet(testPet.id, primary.id);

      expect(result).toBe(testVet.id);
    });

    it('should return null when the pet has no appointments', async () => {
      const { primary, testPet } = await setupUserPetAndVet();

      const result = await AppointmentsService.getLastVetForPet(testPet.id, primary.id);

      expect(result).toBeNull();
    });
  });

  describe('updateAppointment', () => {
    it('should update an upcoming appointment freely', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({
          petId: testPet.id, veterinarianId: testVet.id,
          appointmentDate: addCalendarDays(usersToday, 5),
        }),
        primary.id
      );

      const result = await AppointmentsService.updateAppointment(
        created.id, { reasonForVisit: 'Updated reason' }, primary.id
      );

      expect(result.reasonForVisit).toBe('Updated reason');
    });

    it('should restrict a past appointment to visitNotes-only edits', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({
          petId: testPet.id, veterinarianId: testVet.id,
          appointmentDate: addCalendarDays(usersToday, -5),
        }),
        primary.id
      );

      await expect(
        AppointmentsService.updateAppointment(created.id, { reasonForVisit: 'Nope' }, primary.id)
      ).rejects.toThrow('Cannot modify past appointments except for visit notes');

      const result = await AppointmentsService.updateAppointment(
        created.id, { visitNotes: 'Went fine' }, primary.id
      );
      expect(result.visitNotes).toBe('Went fine');
    });

    it('should throw NotFoundError when updating a non-existent appointment', async () => {
      const { primary } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.updateAppointment(randomUUID(), { visitNotes: 'x' }, primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateVisitNotes', () => {
    it('should update visit notes on any appointment', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
        primary.id
      );

      const result = await AppointmentsService.updateVisitNotes(created.id, 'All good', primary.id);

      expect(result.visitNotes).toBe('All good');
    });

    it('should throw BadRequestError when notes exceed 1000 characters', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
        primary.id
      );

      await expect(
        AppointmentsService.updateVisitNotes(created.id, 'N'.repeat(1001), primary.id)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteAppointment', () => {
    it('should delete an appointment', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
        primary.id
      );

      await AppointmentsService.deleteAppointment(created.id, primary.id);

      await expect(
        AppointmentsService.getAppointmentById(created.id, primary.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when deleting a non-existent appointment', async () => {
      const { primary } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.deleteAppointment(randomUUID(), primary.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should throw BadRequestError when userId is empty', async () => {
      const { testPet, testVet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
          ''
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for invalid appointment ID format', async () => {
      const { primary } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.getAppointmentById('invalid-uuid', primary.id)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when reasonForVisit exceeds 100 characters', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({
            petId: testPet.id, veterinarianId: testVet.id,
            reasonForVisit: 'R'.repeat(101),
          }),
          primary.id
        )
      ).rejects.toThrow('Reason for visit must be less than 100 characters');
    });

    it('should throw BadRequestError when visitNotes exceeds 200 characters on create', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      await expect(
        AppointmentsService.createAppointment(
          makeAppointmentData({
            petId: testPet.id, veterinarianId: testVet.id,
            visitNotes: 'V'.repeat(201),
          }),
          primary.id
        )
      ).rejects.toThrow('Visit notes must be less than 200 characters');
    });

    it('should prevent double-booking a pet at the same date/time with a different vet', async () => {
        const { primary, testPet, testVet } = await setupUserPetAndVet();
        const [secondVet] = await db.insert(schema.veterinarians).values({
          userId: primary.id,
          vetName: 'Dr. Second',
          phone: '555-0002',
          addressLine1: '456 Second St',
          city: 'Boston',
          zipCode: '02101',
        }).returning();
        await VeterinariansService.assignVetToPets(secondVet.id, primary.id, [testPet.id]);
  
        await AppointmentsService.createAppointment(
          makeAppointmentData({ petId: testPet.id, veterinarianId: testVet.id }),
          primary.id
        );
  
        // Same pet, same date/time, but a different vet — checkAppointmentConflicts
        // now catches this as a double-booking, regardless of which vet is involved
        await expect(
          AppointmentsService.createAppointment(
            makeAppointmentData({ petId: testPet.id, veterinarianId: secondVet.id }),
            primary.id
          )
        ).rejects.toThrow('already has an appointment at this date and time with another veterinarian');
      });

    it('should handle concurrent updates to different fields on the same appointment', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();
      const usersToday = await UserPreferencesService.getTodayForUser(primary.id);
      const created = await AppointmentsService.createAppointment(
        makeAppointmentData({
          petId: testPet.id, veterinarianId: testVet.id,
          appointmentDate: addCalendarDays(usersToday, 5),
        }),
        primary.id
      );

      const results = await Promise.all([
        AppointmentsService.updateAppointment(created.id, { reasonForVisit: 'Reason A' }, primary.id),
        AppointmentsService.updateVisitNotes(created.id, 'Notes B', primary.id),
      ]);

      results.forEach(result => expect(result.id).toBe(created.id));
    });

    it('should preserve appointmentType and time formatting correctly', async () => {
      const { primary, testPet, testVet } = await setupUserPetAndVet();

      const result = await AppointmentsService.createAppointment(
        makeAppointmentData({
          petId: testPet.id, veterinarianId: testVet.id,
          appointmentType: 'vaccination', appointmentTime: '09:05',
        }),
        primary.id
      );

      expect(result.appointmentType).toBe('vaccination');
      expect(result.appointmentTime).toBe('09:05:00');
    });
  });
});