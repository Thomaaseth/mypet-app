import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petApi, petErrorHandler } from '@/lib/api/domains/pets'
import { toastService } from '@/lib/toast'
import { useTranslation } from 'react-i18next'
import type { Pet } from '@/types/pet'
import type { PetEditFormData } from '@/lib/validations/pet'
import type { PetImageUploadResponse } from '@/lib/api/domains/pets/types'
import type { PetFormData } from '@/lib/validations/pet';

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
      mutationFn: ({ petId, petData }: { petId: string; petData: PetEditFormData }) => {
        return petApi.updatePet(petId, petData);
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

// Mirrors the backend ORDER BY (desc(isFavorite), desc(createdAt)) so optimistic
// cache updates reorder identically to a server refetch.
function sortPetsByFavorite(a: Pet, b: Pet): number {
  if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
  return b.createdAt.localeCompare(a.createdAt);
}

// SET / CLEAR FAVOURITE
// Optimistic: same cancel → snapshot → update → rollback → invalidate shape as
// useDeletePet. Because only one favourite is allowed, setting a new favourite
// also clears the others in the cache, then re-sorts so it floats to pets[0].
export function useSetFavoritePet() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ petId, isFavorite }: { petId: string; isFavorite: boolean }) =>
      petApi.setPetFavorite(petId, isFavorite),
    onMutate: async ({ petId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: petKeys.all })

      const previousPets = queryClient.getQueryData<Pet[]>(petKeys.all)

      if (previousPets) {
        const next = previousPets
          .map((p) => {
            if (p.id === petId) return { ...p, isFavorite }
            // Unset the previous favourite only when setting a new one
            if (isFavorite && p.isFavorite) return { ...p, isFavorite: false }
            return p
          })
          .sort(sortPetsByFavorite)

        queryClient.setQueryData<Pet[]>(petKeys.all, next)
      }

      return { previousPets }
    },
    onError: (error, _variables, context) => {
      if (context?.previousPets) {
        queryClient.setQueryData(petKeys.all, context.previousPets)
      }
      const appError = petErrorHandler(error)
      toastService.error(t('toasts.pets.favoriteError'), appError.message)
    },
    onSuccess: (_updatedPet, { isFavorite }) => {
      toastService.success(
        t('toasts.pets.favoriteSuccessTitle'),
        isFavorite
          ? t('toasts.pets.pinSuccessDescription')
          : t('toasts.pets.unpinSuccessDescription')
      )
    },
    onSettled: () => {
      // Reconcile with the server's canonical ordering
      queryClient.invalidateQueries({ queryKey: petKeys.all })
    },
  })
}

// Helper: Get pet by ID from cache (no API call)
export function usePetFromCache(petId: string): Pet | undefined {
  const queryClient = useQueryClient()
  const pets = queryClient.getQueryData<Pet[]>(petKeys.all)
  return pets?.find((p) => p.id === petId)
}