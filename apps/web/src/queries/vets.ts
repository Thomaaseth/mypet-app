import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vetApi, vetErrorHandler } from '@/lib/api';
import { toastService } from '@/lib/toast';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

// QUERY KEYS - Centralized for cache management
export const vetKeys = {
  all: ['vets'] as const,
  detail: (id: string) => ['vets', id] as const,
  pets: (vetId: string) => ['vets', vetId, 'pets'] as const,
};

// ============================================
// QUERIES (READ operations)
// ============================================

// Fetch all veterinarians
export function useVeterinarians() {
  return useQuery({
    queryKey: vetKeys.all,
    queryFn: async () => {
      const response = await vetApi.getVeterinarians();
      return response.veterinarians;
    },
  });
}

// Fetch veterinarian by ID
export function useVeterinarian(vetId: string) {
  return useQuery({
    queryKey: vetKeys.detail(vetId),
    queryFn: () => vetApi.getVeterinarianById(vetId),
    enabled: Boolean(vetId), // only run if vetId exists
  });
}

// Fetch pets assigned to a veterinarian
export function useVetPets(vetId: string) {
  return useQuery({
    queryKey: vetKeys.pets(vetId),
    queryFn: () => vetApi.getVetPets(vetId),
    enabled: Boolean(vetId),
  });
}

// Get veterinarian from cache (useful for optimistic updates)
export function useVeterinarianFromCache(vetId: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<Veterinarian>(vetKeys.detail(vetId));
}

// ============================================
// MUTATIONS (WRITE operations)
// ============================================

// CREATE
export function useCreateVeterinarian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vetData,
      petIds,
      isPrimaryForPet,
    }: {
      vetData: VeterinarianFormData;
      petIds?: string[];
      isPrimaryForPet?: boolean;
    }) => {
      return vetApi.createVeterinarian(vetData, { petIds, isPrimaryForPet });
    },
    onSuccess: (newVet) => {
      // Invalidate and refetch veterinarians list
      queryClient.invalidateQueries({ queryKey: vetKeys.all });

      // Show success toast
      toastService.success(
        'Veterinarian added',
        `${newVet.clinicName || newVet.vetName} has been added!`
      );
    },
    onError: (error) => {
      const appError = vetErrorHandler(error);
      toastService.error('Failed to add veterinarian', appError.message);
    },
  });
}

// UPDATE
export function useUpdateVeterinarian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vetId,
      vetData,
    }: {
      vetId: string;
      vetData: Partial<VeterinarianFormData>;
    }) => {
      return vetApi.updateVeterinarian(vetId, vetData);
    },
    onSuccess: (updatedVet) => {
      // Invalidate both list and detail caches
      queryClient.invalidateQueries({ queryKey: vetKeys.all });
      queryClient.invalidateQueries({ queryKey: vetKeys.detail(updatedVet.id) });

      // Show success toast
      toastService.success(
        'Veterinarian updated',
        `${updatedVet.clinicName || updatedVet.vetName} has been updated!`
      );
    },
    onError: (error) => {
      const appError = vetErrorHandler(error);
      toastService.error('Failed to update veterinarian', appError.message);
    },
  });
}

// DELETE
export function useDeleteVeterinarian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vetId: string) => vetApi.deleteVeterinarian(vetId),
    onSuccess: (_, vetId) => {
      // Invalidate list cache
      queryClient.invalidateQueries({ queryKey: vetKeys.all });
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: vetKeys.detail(vetId) });

      // Show success toast
      toastService.success('Veterinarian deleted', 'The veterinarian has been removed.');
    },
    onError: (error) => {
      const appError = vetErrorHandler(error);
      toastService.error('Failed to delete veterinarian', appError.message);
    },
  });
}

// ASSIGN VET TO PETS
export function useAssignVetToPets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vetId,
      petIds,
      isPrimaryForPet,
    }: {
      vetId: string;
      petIds: string[];
      isPrimaryForPet?: boolean;
    }) => {
      return vetApi.assignVetToPets(vetId, petIds, isPrimaryForPet);
    },
    onSuccess: (_, { vetId }) => {
      // Invalidate vet details and pets list
      queryClient.invalidateQueries({ queryKey: vetKeys.detail(vetId) });
      queryClient.invalidateQueries({ queryKey: vetKeys.pets(vetId) });
      queryClient.invalidateQueries({ queryKey: vetKeys.all });

      // Show success toast
      toastService.success('Pets assigned', 'Veterinarian has been assigned to selected pets.');
    },
    onError: (error) => {
      const appError = vetErrorHandler(error);
      toastService.error('Failed to assign veterinarian', appError.message);
    },
  });
}

// UNASSIGN VET FROM PETS
export function useUnassignVetFromPets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vetId, petIds }: { vetId: string; petIds: string[] }) => {
      return vetApi.unassignVetFromPets(vetId, petIds);
    },
    onSuccess: (_, { vetId }) => {
      // Invalidate vet details and pets list
      queryClient.invalidateQueries({ queryKey: vetKeys.detail(vetId) });
      queryClient.invalidateQueries({ queryKey: vetKeys.pets(vetId) });
      queryClient.invalidateQueries({ queryKey: vetKeys.all });

      // Show success toast
      toastService.success(
        'Pets unassigned',
        'Veterinarian has been unassigned from selected pets.'
      );
    },
    onError: (error) => {
      const appError = vetErrorHandler(error);
      toastService.error('Failed to unassign veterinarian', appError.message);
    },
  });
}