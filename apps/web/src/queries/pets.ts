import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petApi, petErrorHandler } from '@/lib/api/domains/pets'
import { toastService } from '@/lib/toast'
import { useTranslation } from 'react-i18next'
import type { Pet, PetFormData } from '@/types/pet'
import type { PetImageUploadResponse } from '@/lib/api/domains/pets/types'

// QUERY KEYS - Centralized for cache management
export const petKeys = {
    all: ['pets'] as const,
    detail: (id: string) => ['pets', id] as const,
    signedUrl: (id: string) => ['pets', id, 'signed-url'] as const,

  }

// QUERIES (READ operations)
// Fetch all pets
export function usePets() {
    return useQuery({
      queryKey: petKeys.all,
      queryFn: () => petApi.getPets()
    })
  }

// Fetch pet by ID
export function usePet(petId: string) {
    return useQuery({
        queryKey: petKeys.detail(petId),
        queryFn: () => petApi.getPetById(petId), // Pet
        enabled: Boolean(petId),
    })
  }

export function usePetSignedUrl(petId: string, hasImage: boolean) {
    return useQuery({
        queryKey: petKeys.signedUrl(petId),
        queryFn: () => petApi.getPetSignedUrl(petId),
        enabled: Boolean(petId) && hasImage, // only fetch if pet actually has an image
        staleTime: 55 * 60 * 1000, // 55 min, under Supabase's 1h URL expiry
        gcTime: 60 * 60 * 1000,    // 60 min, keep in cache for the full URL lifetime
    })
}

// MUTATIONS (WRITE operations)
// CREATE
export function useCreatePet() {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
  
    return useMutation({
      mutationFn: (petData: PetFormData) => {
        // Transform data (comma to dot for weight)
        const transformedData = {
          ...petData,
          weight: petData.weight ? petData.weight.replace(',', '.') : ''
        }
        return petApi.createPet(transformedData)
      },
      onSuccess: (newPet) => {
        // Invalidate and refetch pets list
        queryClient.invalidateQueries({ queryKey: petKeys.all })
        
        // Show success toast
        toastService.success(t('toasts.pets.createSuccessTitle'), t('toasts.pets.createSuccessDescription', { name: newPet.name }))
      },
      onError: (error) => {
        const appError = petErrorHandler(error)
        toastService.error(t('toasts.pets.createError'), appError.message)
      },
    })
  }
  
// UPDATE 
export function useUpdatePet() {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
  
    return useMutation({
      mutationFn: ({ petId, petData }: { petId: string; petData: Partial<PetFormData> }) => {
        const rest: Partial<PetFormData> = { ...petData };
        delete rest.weight;
        delete rest.weightUnit;

        const transformedData: Partial<PetFormData> =
          petData.weight !== undefined && petData.weight !== ''
            ? { ...rest, weight: petData.weight.replace(',', '.') }
            : rest;

        return petApi.updatePet(petId, transformedData);
      },
      onSuccess: (updatedPet) => {
        // Seed the detail cache directly from the server response — the PUT
        // returns the same plain Pet row shape as GET /pets/:id, so this is
        // safe and saves a refetch (see: updates from mutation responses)
        queryClient.setQueryData<Pet>(petKeys.detail(updatedPet.id), updatedPet)

        // Refetch ONLY the list. exact: true is load-bearing: without it,
        // the ['pets'] prefix would also invalidate the detail key we just
        // seeded (undoing the optimization) plus signed-url entries.
        queryClient.invalidateQueries({ queryKey: petKeys.all, exact: true })

        toastService.success(t('toasts.pets.updateSuccessTitle'), t('toasts.pets.updateSuccessDescription', { name: updatedPet.name }))
      },
      onError: (error) => {
        const appError = petErrorHandler(error)
        toastService.error(t('toasts.pets.updateError'), appError.message)
      },
    })
  }

// DELETE (soft delete)
export function useDeletePet() {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
  
    return useMutation({
      mutationFn: (petId: string) => petApi.deletePet(petId),
      // Optimistic delete: cancel → snapshot → filter → rollback (onError) → invalidate (onSettled)
      onMutate: async (petId) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: petKeys.all })
  
        // Snapshot previous value
        const previousPets = queryClient.getQueryData<Pet[]>(petKeys.all)
  
        // Optimistically remove pet from cache
        if (previousPets) {
          queryClient.setQueryData<Pet[]>(
            petKeys.all,
            previousPets.filter((p) => p.id !== petId)
          )
        }
  
        // Return context with previous data for rollback
        return { previousPets }
      },
      onError: (error, _petId, context) => {
        // Rollback on error
        if (context?.previousPets) {
          queryClient.setQueryData(petKeys.all, context.previousPets)
        }
        
        const appError = petErrorHandler(error)
        toastService.error(t('toasts.pets.deleteError'), appError.message)
      },
      onSuccess: (_data, petId, context) => {
        // Get pet name from the snapshot for toast
        const deletedPet = context?.previousPets?.find((p) => p.id === petId);
        const petName = deletedPet?.name || t('toasts.pets.deleteFallbackName');
        
        toastService.success(t('toasts.pets.deleteSuccessTitle'), t('toasts.pets.deleteSuccessDescription', { name: petName }))
      },
      onSettled: () => {
        // Always refetch to sync with server (regardless of success/error)
        queryClient.invalidateQueries({ queryKey: petKeys.all })
      },
    })
  }

  // UPLOAD image
  export function useUploadPetImage(petId: string) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
      mutationFn: (file: File) => petApi.uploadPetImage(petId, file),
      onSuccess: (response: PetImageUploadResponse) => {
      // Directly set the new signed URL in cache — no refetch needed,
      queryClient.setQueryData(petKeys.signedUrl(petId), response.signedUrl);

      // Update the pet in the list cache directly
      queryClient.setQueryData<Pet[]>(petKeys.all, (prev) =>
        prev?.map((p) => (p.id === petId ? response.pet : p)) ?? prev
      );

      // Update pet detail cache
      queryClient.setQueryData(petKeys.detail(petId), response.pet);
      toastService.success(t('toasts.pets.uploadPhotoSuccessTitle'), t('toasts.pets.uploadPhotoSuccessDescription'))
      },
      onError: (error) => {
        const appError = petErrorHandler(error);
        toastService.error(t('toasts.pets.uploadPhotoError'), appError.message)
      }
    })
  }

  // DELETE image
  export function useDeletePetImage(petId: string) {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
  
    return useMutation({
      mutationFn: () => petApi.deletePetImage(petId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: petKeys.all });
        queryClient.invalidateQueries({ queryKey: petKeys.detail(petId) });
        toastService.success(t('toasts.pets.removePhotoSuccessTitle'), t('toasts.pets.removePhotoSuccessDescription'));
      },
      onError: (error) => {
        const appError = petErrorHandler(error);
        toastService.error(t('toasts.pets.removePhotoError'), appError.message);
      },
    });
  }

// Helper: Get pet by ID from cache (no API call)
export function usePetFromCache(petId: string): Pet | undefined {
  const queryClient = useQueryClient()
  const pets = queryClient.getQueryData<Pet[]>(petKeys.all)
  return pets?.find((p) => p.id === petId)
}