import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { vetApi, vetErrorHandler } from '@/lib/api';
import { toastService } from '@/lib/toast';
import type { Veterinarian, VeterinarianFormData } from '@/types/veterinarian';

// QUERY KEYS - Centralized for cache management
export const vetKeys = {
  all: ['vets'] as const,
  detail: (id: string) => ['vets', id] as const,
  pets: (vetId: string) => ['vets', vetId, 'pets'] as const,
  petVets: (petId: string) => ['pets', petId, 'vets'] as const,
};

// CACHE HELPERS
// Invalidates all pet-related caches affected by vet changes:
// pets list (['pets']), pet details (['pets', id]) and pet→vet
// assignments (['pets', id, 'vets']) while EXCLUDING signed image
// URLs (['pets', id, 'signed-url']), which have a deliberate 55min
// staleTime and stay valid regardless of vet changes.
// invalidateQueries matches by key prefix AND predicate when both are given:
function invalidatePetRelatedCaches(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: ['pets'],
    predicate: (query) => !query.queryKey.includes('signed-url'),
  });
}

// ============================================
// QUERIES (READ operations)
// ============================================

// Fetch all veterinarians
export function useVeterinarians() {
  return useQuery({
    queryKey: vetKeys.all,
    queryFn: () => vetApi.getVeterinarians(),
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

// Fetch veterinarians assigned to a pet
export function usePetVets(petId: string) {
  return useQuery({
    queryKey: vetKeys.petVets(petId),
    queryFn: () => vetApi.getPetVets(petId),
    enabled: Boolean(petId),
  });
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
    }: {
      vetData: VeterinarianFormData;
      petIds?: string[];
    }) => {
      return vetApi.createVeterinarian(vetData, { petIds });
    },
    onSuccess: (newVet) => {
      // Invalidate and refetch veterinarians list and pets assignements
      queryClient.invalidateQueries({ queryKey: vetKeys.all });
      // Refetch pet-side caches (assignments may have changed via petIds)
      invalidatePetRelatedCaches(queryClient);

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
      // Pet-side caches embed vet info (names in dropdowns/lists)
      invalidatePetRelatedCaches(queryClient);

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
      
      // Drop the deleted vet's detail entry entirely (it no longer exists;
      // removeQueries frees the cache entry rather than refetching a 404)
      queryClient.removeQueries({ queryKey: vetKeys.detail(vetId) });

      // Backend cascade-unassigns the vet from pets — refetch pet-side
      // caches so assignment lists & appointment dropdowns drop it too.
      // (Fixes: deleted vet lingering in dropdowns until page refresh.)
      invalidatePetRelatedCaches(queryClient);

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
    }: {
      vetId: string;
      petIds: string[];
    }) => {
      return vetApi.assignVetToPets(vetId, petIds);
    },
    onSuccess: () => {
      // Invalidate vet details and pets list
      // vetKeys.all prefix covers detail(vetId) and pets(vetId)
      queryClient.invalidateQueries({ queryKey: vetKeys.all });
      invalidatePetRelatedCaches(queryClient);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vetKeys.all });
      invalidatePetRelatedCaches(queryClient);

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