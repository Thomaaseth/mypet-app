import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, appointmentErrorHandler } from '@/lib/api';
import { toastService } from '@/lib/toast';
import type { 
  AppointmentWithRelations, 
  AppointmentFormData,
  AppointmentFilter 
} from '@/types/appointments';

// QUERY KEYS - Centralized for cache management
export const appointmentKeys = {
  all: ['appointments'] as const,
  upcoming: () => ['appointments', 'upcoming'] as const,
  past: () => ['appointments', 'past'] as const,
  detail: (id: string) => ['appointments', id] as const,
  lastVet: (petId: string) => ['appointments', 'last-vet', petId] as const,
};

// ============================================
// QUERIES (READ operations)
// ============================================

// Fetch appointments with filter (upcoming or past)
export function useAppointments(filter: AppointmentFilter = 'upcoming') {
  return useQuery({
    queryKey: filter === 'upcoming' ? appointmentKeys.upcoming() : appointmentKeys.past(),
    queryFn: async () => {
      const response = await appointmentApi.getAppointments(filter);
      return response.appointments;
    },
  });
}

// Fetch appointment by ID
export function useAppointment(appointmentId: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => appointmentApi.getAppointmentById(appointmentId),
    enabled: Boolean(appointmentId), // only run if appointmentId exists
  });
}

// Fetch last vet used for a pet (for smart pre-fill)
export function useLastVetForPet(petId: string) {
  return useQuery({
    queryKey: appointmentKeys.lastVet(petId),
    queryFn: () => appointmentApi.getLastVetForPet(petId),
    enabled: Boolean(petId),
    staleTime: 5 * 60 * 1000, // 5 minutes - reasonable for pre-fill data
  });
}

// Get appointment from cache (useful for optimistic updates)
export function useAppointmentFromCache(appointmentId: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<AppointmentWithRelations>(
    appointmentKeys.detail(appointmentId)
  );
}

// ============================================
// MUTATIONS (WRITE operations)
// ============================================

// CREATE
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentData: AppointmentFormData) => {
      return appointmentApi.createAppointment(appointmentData);
    },
    onSuccess: (newAppointment) => {
      // Invalidate both upcoming and past lists (it could be either)
      queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.past() });
      
      // Invalidate last vet cache for this pet
      queryClient.invalidateQueries({ 
        queryKey: appointmentKeys.lastVet(newAppointment.petId) 
      });

      // Show success toast
      toastService.success(
        'Appointment created',
        `Appointment scheduled for ${newAppointment.pet.name}`
      );
    },
    onError: (error) => {
      const appError = appointmentErrorHandler(error);
      toastService.error('Failed to create appointment', appError.message);
    },
  });
}

// UPDATE
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      appointmentData,
    }: {
      appointmentId: string;
      appointmentData: Partial<AppointmentFormData>;
    }) => {
      return appointmentApi.updateAppointment(appointmentId, appointmentData);
    },
    onSuccess: (updatedAppointment) => {
      // Invalidate both lists (date might have changed)
      queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.past() });
      
      // Invalidate detail cache
      queryClient.invalidateQueries({ 
        queryKey: appointmentKeys.detail(updatedAppointment.id) 
      });

      // Show success toast
      toastService.success(
        'Appointment updated',
        `Updated appointment for ${updatedAppointment.pet.name}`
      );
    },
    onError: (error) => {
      const appError = appointmentErrorHandler(error);
      toastService.error('Failed to update appointment', appError.message);
    },
  });
}

// UPDATE VISIT NOTES ONLY (for past appointments)
export function useUpdateVisitNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      visitNotes,
    }: {
      appointmentId: string;
      visitNotes: string;
    }) => {
      return appointmentApi.updateVisitNotes(appointmentId, visitNotes);
    },
    onSuccess: (updatedAppointment) => {
      // Only invalidate past list (notes only updated on past appointments)
      queryClient.invalidateQueries({ queryKey: appointmentKeys.past() });
      
      // Invalidate detail cache
      queryClient.invalidateQueries({ 
        queryKey: appointmentKeys.detail(updatedAppointment.id) 
      });

      // Show success toast
      toastService.success('Visit notes updated', 'Notes saved successfully');
    },
    onError: (error) => {
      const appError = appointmentErrorHandler(error);
      toastService.error('Failed to update notes', appError.message);
    },
  });
}

// DELETE
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) => appointmentApi.deleteAppointment(appointmentId),
    onMutate: async (appointmentId) => {
      // Cancel outgoing refetches for upcoming and past
      await queryClient.cancelQueries({ queryKey: appointmentKeys.upcoming() });
      await queryClient.cancelQueries({ queryKey: appointmentKeys.past() });

      // Snapshot previous values
      const previousUpcoming = queryClient.getQueryData(appointmentKeys.upcoming());
      const previousPast = queryClient.getQueryData(appointmentKeys.past());

      // Optimistically remove appointment from both caches
      queryClient.setQueryData<AppointmentWithRelations[]>(
        appointmentKeys.upcoming(),
        (old) => old?.filter(appointment => appointment.id !== appointmentId)
      );
      queryClient.setQueryData<AppointmentWithRelations[]>(
        appointmentKeys.past(),
        (old) => old?.filter(appointment => appointment.id !== appointmentId)
      );

      // Return context for rollback
      return { previousUpcoming, previousPast };
    },
    onSuccess: () => {
      // Show success toast
      toastService.success('Appointment deleted', 'The appointment has been removed.');
    },
    onError: (error, _appointmentId, context) => {
      // Rollback on error
      if (context?.previousUpcoming) {
        queryClient.setQueryData(appointmentKeys.upcoming(), context.previousUpcoming);
      }
      if (context?.previousPast) {
        queryClient.setQueryData(appointmentKeys.past(), context.previousPast);
      }

      const appError = appointmentErrorHandler(error);
      toastService.error('Failed to delete appointment', appError.message);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: appointmentKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.past() });
    },
  });
}