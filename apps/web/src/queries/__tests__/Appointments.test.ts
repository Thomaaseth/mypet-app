/**
 * Appointments Queries Test Suite
 * 
 * Tests all React Query hooks in src/queries/appointments.ts
 * 
 * What we're testing:
 * 1. Data fetching (upcoming, past appointments)
 * 2. Query key invalidation (cache management)
 * 3. CRUD operations (create, update, delete)
 * 4. Special operations (update visit notes, get last vet)
 * 5. Optimistic updates (delete)
 * 6. Error handling (validation, network, not found)
 * 7. Loading states
 * 8. Cache operations (useAppointmentFromCache)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '@/test/utils/test-utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useAppointments,
  useAppointment,
  useLastVetForPet,
  useAppointmentFromCache,
  useCreateAppointment,
  useUpdateAppointment,
  useUpdateVisitNotes,
  useDeleteAppointment,
  appointmentKeys,
} from '@/queries/appointments';
import { 
  mockUpcomingAppointments, 
  mockPastAppointments,
  mockPets,
  mockVeterinarians,
  resetMockAppointments 
} from '@/test/mocks/handlers';
import type { AppointmentWithRelations, AppointmentFormData } from '@/types/appointments';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper constants using actual mock IDs (UUIDs)
const TEST_PET_ID = () => mockPets[0].id;
const TEST_PET_ID_2 = () => mockPets[1].id;
const TEST_VET_ID = () => mockVeterinarians[0].id;
const TEST_VET_ID_2 = () => mockVeterinarians[1].id;

describe('Appointments Queries', () => {

  beforeEach(() => {
    resetMockAppointments();
  });

  console.log('🧪 Appointments Test suite loading');

  // ============================================
  // READ OPERATIONS (Queries)
  // ============================================

  describe('useAppointments', () => {
    it('should fetch and return upcoming appointments', async () => {
      const { result } = renderHookWithQuery(() => useAppointments('upcoming'));

      // Initial loading state
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert data matches mock
      expect(result.current.data).toEqual(mockUpcomingAppointments);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].appointmentType).toBe('checkup');
    });

    it('should fetch and return past appointments', async () => {
      const { result } = renderHookWithQuery(() => useAppointments('past'));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPastAppointments);
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].visitNotes).toBe('Checkup went well');
    });

    it('should handle empty appointments list', async () => {
      // Override default handler for this test
      server.use(
        http.get(`${API_BASE_URL}/appointments`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              appointments: [],
              total: 0,
            },
            message: 'Retrieved 0 appointment(s)',
          });
        })
      );

      const { result } = renderHookWithQuery(() => useAppointments('upcoming'));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle API errors', async () => {
      // Simulate network error
      server.use(
        http.get(`${API_BASE_URL}/appointments`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Internal server error',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useAppointments('upcoming'));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should default to upcoming when no filter provided', async () => {
      const { result } = renderHookWithQuery(() => useAppointments());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should get upcoming appointments by default
      expect(result.current.data).toEqual(mockUpcomingAppointments);
    });
  });

  describe('useAppointment', () => {
    it('should fetch single appointment by ID', async () => {
      const appointmentId = 'appt-1';
      const { result } = renderHookWithQuery(() => useAppointment(appointmentId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.id).toBe(appointmentId);
      expect(result.current.data?.appointmentType).toBe('checkup');
      expect(result.current.data?.pet).toBeDefined();
      expect(result.current.data?.veterinarian).toBeDefined();
    });

    it('should handle appointment not found', async () => {
      const nonExistentId = 'appt-999';
      
      server.use(
        http.get(`${API_BASE_URL}/appointments/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Appointment not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useAppointment(nonExistentId));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should not fetch when appointmentId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useAppointment(''));

      // Should stay in idle state
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useLastVetForPet', () => {
    it('should fetch last vet ID for a pet', async () => {
      const petId = mockPets[0].id; // Use UUID from mockPets
      const { result } = renderHookWithQuery(() => useLastVetForPet(petId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(mockVeterinarians[0].id);
    });

    it('should return null when no appointments exist for pet', async () => {
      const petId = mockPets[1].id; // Use UUID for pet-2
      
      server.use(
        http.get(`${API_BASE_URL}/appointments/last-vet/:petId`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              veterinarianId: null,
            },
            message: 'No appointments found for this pet',
          });
        })
      );

      const { result } = renderHookWithQuery(() => useLastVetForPet(petId));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should not fetch when petId is empty (enabled: false)', async () => {
      const { result } = renderHookWithQuery(() => useLastVetForPet(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should respect custom enabled option', async () => {
      const petId = mockPets[0].id;
      const { result } = renderHookWithQuery(() => 
        useLastVetForPet(petId, { enabled: false })
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useAppointmentFromCache', () => {
    it('should return undefined when appointment not in cache', () => {
      const { result } = renderHookWithQuery(() => {
        return useAppointmentFromCache('appt-1');
      });

      expect(result.current).toBeUndefined();
    });

    it('should return appointment from cache after fetching', async () => {
      const appointmentId = 'appt-1';
      
      // First fetch the appointment to populate cache
      const { result: fetchResult, queryClient } = renderHookWithQuery(() => 
        useAppointment(appointmentId)
      );

      await waitFor(() => {
        expect(fetchResult.current.isSuccess).toBe(true);
      });

      // Now get from cache
      const { result: cacheResult } = renderHookWithQuery(
        () => useAppointmentFromCache(appointmentId),
        { queryClient }
      );

      expect(cacheResult.current).toBeDefined();
      expect(cacheResult.current?.id).toBe(appointmentId);
      expect(cacheResult.current?.appointmentType).toBe('checkup');
    });
  });

  // ============================================
  // WRITE OPERATIONS (Mutations)
  // ============================================

  describe('useCreateAppointment', () => {
    it('should create new appointment and invalidate upcoming/past lists', async () => {
      // STEP 1: Fetch upcoming appointments first (so query exists in cache)
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      expect(upcomingResult.current.data).toHaveLength(2);
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateAppointment(),
        { queryClient }
      );
  
      // Use actual pet and vet IDs from mockPets and mockVeterinarians (which are UUIDs)
      const petId = mockPets[0].id; // UUID from mockPets
      const vetId = mockVeterinarians[0].id; // UUID from mockVeterinarians
      
      const newAppointmentData: AppointmentFormData = {
        petId,
        veterinarianId: vetId,
        appointmentDate: '2025-02-15',
        appointmentTime: '14:00',
        appointmentType: 'surgery',
        reasonForVisit: 'Emergency',
        visitNotes: '',
      };
  
      // STEP 3: Execute mutation
      let createdAppointment: AppointmentWithRelations | undefined;
      await waitFor(async () => {
        createdAppointment = await mutationResult.current.mutateAsync(newAppointmentData);
      });
  
      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
  
      // STEP 4: Verify appointment was created with correct data
      expect(createdAppointment).toBeDefined();
      expect(createdAppointment?.appointmentType).toBe('surgery');
      expect(createdAppointment?.reasonForVisit).toBe('Emergency');
  
      // STEP 5: Verify cache invalidation happened
      const upcomingQueryState = queryClient.getQueryState(appointmentKeys.upcoming());
      expect(upcomingQueryState).toBeDefined();
      
      // STEP 6: Verify the query refetched (appointments list updates automatically)
      await waitFor(() => {
        expect(upcomingResult.current.data).toHaveLength(3);
        expect(upcomingResult.current.data?.find(a => a.appointmentType === 'surgery')).toBeDefined();
      });
    });

    it('should create appointment with all appointment types', async () => {
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateAppointment(),
        { queryClient }
      );

      const appointmentTypes: Array<'checkup' | 'vaccination' | 'surgery' | 'dental' | 'grooming' | 'emergency' | 'other'> = [
        'checkup', 'vaccination', 'surgery', 'dental', 'grooming', 'emergency', 'other'
      ];

      for (const type of appointmentTypes) {
        const appointmentData: AppointmentFormData = {
          petId: TEST_PET_ID(),
          veterinarianId: TEST_VET_ID(),
          appointmentDate: '2025-02-15',
          appointmentTime: '10:00',
          appointmentType: type,
          reasonForVisit: `Test ${type}`,
          visitNotes: '',
        };

        await mutationResult.current.mutateAsync(appointmentData);

        await waitFor(() => {
          expect(mutationResult.current.isSuccess).toBe(true);
        });
      }
    });

    it('should handle validation errors', async () => {
      server.use(
        http.post(`${API_BASE_URL}/appointments`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Appointment date is required',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useCreateAppointment());

      const invalidData: AppointmentFormData = {
        petId: TEST_PET_ID(),
        veterinarianId: TEST_VET_ID(),
        appointmentDate: '',
        appointmentTime: '10:00',
        appointmentType: 'checkup',
        reasonForVisit: '',
        visitNotes: '',
      };

      // Should fail
      await expect(
        result.current.mutateAsync(invalidData)
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateAppointment', () => {
    it('should update appointment and invalidate caches', async () => {
      const appointmentId = 'appt-1';
      
      // STEP 1: Fetch upcoming appointments first
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      expect(upcomingResult.current.data).toHaveLength(2);
      const originalAppointment = upcomingResult.current.data?.find(a => a.id === appointmentId);
      expect(originalAppointment?.appointmentTime).toBe('10:00:00');
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateAppointment(),
        { queryClient }
      );

      // STEP 3: Execute mutation
      const updateData: Partial<AppointmentFormData> = {
        appointmentTime: '11:00',
        reasonForVisit: 'Updated reason',
      };

      await mutationResult.current.mutateAsync({
        appointmentId,
        appointmentData: updateData,
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const upcomingQueryState = queryClient.getQueryState(appointmentKeys.upcoming());
      expect(upcomingQueryState).toBeDefined();

      // STEP 5: Verify the appointments list refetched with updated data
      await waitFor(() => {
        const updatedAppointment = upcomingResult.current.data?.find(a => a.id === appointmentId);
        expect(updatedAppointment?.appointmentTime).toBe('11:00:00');
        expect(updatedAppointment?.reasonForVisit).toBe('Updated reason');
      });
    });

    it('should handle partial updates', async () => {
      const appointmentId = 'appt-1';
      
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateAppointment(),
        { queryClient }
      );

      // Only update reason for visit
      const updateData: Partial<AppointmentFormData> = {
        reasonForVisit: 'Follow-up checkup',
      };

      await mutationResult.current.mutateAsync({
        appointmentId,
        appointmentData: updateData,
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // Verify cache was invalidated
      const upcomingQueryState = queryClient.getQueryState(appointmentKeys.upcoming());
      expect(upcomingQueryState).toBeDefined();
    });

    it('should handle validation errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/appointments/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Invalid appointment time format',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdateAppointment());

      const invalidData: Partial<AppointmentFormData> = {
        appointmentTime: 'invalid-time',
      };

      await expect(
        result.current.mutateAsync({
          appointmentId: 'appt-1',
          appointmentData: invalidData,
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should handle not found errors', async () => {
      server.use(
        http.put(`${API_BASE_URL}/appointments/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Appointment not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdateAppointment());

      await expect(
        result.current.mutateAsync({
          appointmentId: 'appt-999',
          appointmentData: { reasonForVisit: 'Test' },
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateVisitNotes', () => {
    it('should update visit notes for past appointment', async () => {
      const appointmentId = 'appt-past-1';
      
      // STEP 1: Fetch past appointments first
      const { result: pastResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('past')
      );
      
      await waitFor(() => {
        expect(pastResult.current.isSuccess).toBe(true);
      });
      
      expect(pastResult.current.data).toHaveLength(1);
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useUpdateVisitNotes(),
        { queryClient }
      );

      // STEP 3: Execute mutation
      const newNotes = 'Pet responded well to treatment. Schedule follow-up in 3 months.';

      await mutationResult.current.mutateAsync({
        appointmentId,
        visitNotes: newNotes,
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const pastQueryState = queryClient.getQueryState(appointmentKeys.past());
      expect(pastQueryState).toBeDefined();
    });

    it('should handle validation errors', async () => {
      server.use(
        http.patch(`${API_BASE_URL}/appointments/:id/notes`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Visit notes cannot exceed 1000 characters',
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useUpdateVisitNotes());

      const tooLongNotes = 'a'.repeat(1001);

      await expect(
        result.current.mutateAsync({
          appointmentId: 'appt-past-1',
          visitNotes: tooLongNotes,
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useDeleteAppointment', () => {
    it('should delete appointment with optimistic update', async () => {
      const appointmentId = 'appt-2';
      
      // STEP 1: Fetch upcoming appointments first
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      expect(upcomingResult.current.data).toHaveLength(2);
      
      // STEP 2: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteAppointment(),
        { queryClient }
      );

      // STEP 3: Execute mutation
      await mutationResult.current.mutateAsync(appointmentId);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });

      // STEP 4: Verify cache was invalidated
      const upcomingQueryState = queryClient.getQueryState(appointmentKeys.upcoming());
      expect(upcomingQueryState).toBeDefined();

      // STEP 5: Verify the appointments list refetched without the deleted appointment
      await waitFor(() => {
        expect(upcomingResult.current.data).toHaveLength(1);
        expect(upcomingResult.current.data?.find(a => a.id === appointmentId)).toBeUndefined();
      });
    });

    it('should handle not found errors', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/appointments/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Appointment not found',
            },
            { status: 404 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useDeleteAppointment());

      await expect(
        result.current.mutateAsync('appt-999')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should rollback on error', async () => {
      const appointmentId = 'appt-1';
      
      // STEP 1: Fetch upcoming appointments
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      const originalCount = upcomingResult.current.data?.length;
      expect(originalCount).toBe(2);
      
      // STEP 2: Mock error response
      server.use(
        http.delete(`${API_BASE_URL}/appointments/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Server error',
            },
            { status: 500 }
          );
        })
      );
      
      // STEP 3: Create mutation with SAME queryClient
      const { result: mutationResult } = renderHookWithQuery(
        () => useDeleteAppointment(),
        { queryClient }
      );

      // STEP 4: Execute mutation (should fail)
      await expect(
        mutationResult.current.mutateAsync(appointmentId)
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mutationResult.current.isError).toBe(true);
      });

      // STEP 5: Verify rollback - original data should be restored
      await waitFor(() => {
        expect(upcomingResult.current.data).toHaveLength(originalCount!);
      });
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle concurrent mutations', async () => {
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      const { result: createResult } = renderHookWithQuery(
        () => useCreateAppointment(),
        { queryClient }
      );

      const { result: updateResult } = renderHookWithQuery(
        () => useUpdateAppointment(),
        { queryClient }
      );

      const newAppointmentData: AppointmentFormData = {
        petId: TEST_PET_ID(),
        veterinarianId: TEST_VET_ID(),
        appointmentDate: '2025-03-01',
        appointmentTime: '09:00',
        appointmentType: 'checkup',
        reasonForVisit: 'Concurrent test',
        visitNotes: '',
      };

      const updateData: Partial<AppointmentFormData> = {
        reasonForVisit: 'Updated concurrently',
      };

      // Execute mutations concurrently
      const promises = [
        createResult.current.mutateAsync(newAppointmentData),
        updateResult.current.mutateAsync({ 
          appointmentId: 'appt-1', 
          appointmentData: updateData 
        }),
      ];

      await Promise.all(promises);

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true);
        expect(updateResult.current.isSuccess).toBe(true);
      });
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/appointments`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: 'Network error',
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHookWithQuery(() => useAppointments('upcoming'));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle empty string fields correctly', async () => {
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateAppointment(),
        { queryClient }
      );

      const appointmentData: AppointmentFormData = {
        petId: TEST_PET_ID(),
        veterinarianId: TEST_VET_ID(),
        appointmentDate: '2025-02-20',
        appointmentTime: '15:00',
        appointmentType: 'other',
        reasonForVisit: '', // Empty string
        visitNotes: '', // Empty string
      };

      await mutationResult.current.mutateAsync(appointmentData);

      await waitFor(() => {
        expect(mutationResult.current.isSuccess).toBe(true);
      });
    });

    it('should handle appointment on boundary times', async () => {
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateAppointment(),
        { queryClient }
      );

      const boundaryTimes = ['00:00', '23:55'];

      for (const time of boundaryTimes) {
        const appointmentData: AppointmentFormData = {
          petId: TEST_PET_ID(),
          veterinarianId: TEST_VET_ID(),
          appointmentDate: '2025-02-25',
          appointmentTime: time,
          appointmentType: 'emergency',
          reasonForVisit: `Boundary time test: ${time}`,
          visitNotes: '',
        };

        await mutationResult.current.mutateAsync(appointmentData);

        await waitFor(() => {
          expect(mutationResult.current.isSuccess).toBe(true);
        });
      }
    });

    it('should handle multiple appointments for same pet and vet', async () => {
      const { result: upcomingResult, queryClient } = renderHookWithQuery(() => 
        useAppointments('upcoming')
      );
      
      await waitFor(() => {
        expect(upcomingResult.current.isSuccess).toBe(true);
      });
      
      const { result: mutationResult } = renderHookWithQuery(
        () => useCreateAppointment(),
        { queryClient }
      );

      // Create multiple appointments for same pet/vet at different times
      const appointments: AppointmentFormData[] = [
        {
          petId: TEST_PET_ID(),
          veterinarianId: TEST_VET_ID(),
          appointmentDate: '2025-03-01',
          appointmentTime: '09:00',
          appointmentType: 'checkup',
          reasonForVisit: 'Morning checkup',
          visitNotes: '',
        },
        {
          petId: TEST_PET_ID(),
          veterinarianId: TEST_VET_ID(),
          appointmentDate: '2025-03-01',
          appointmentTime: '14:00',
          appointmentType: 'vaccination',
          reasonForVisit: 'Afternoon vaccination',
          visitNotes: '',
        },
      ];

      for (const appt of appointments) {
        await mutationResult.current.mutateAsync(appt);

        await waitFor(() => {
          expect(mutationResult.current.isSuccess).toBe(true);
        });
      }
    });
  });
});