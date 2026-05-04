import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petApi, petErrorHandler } from '@/lib/api/domains/pets'
import { toastService } from '@/lib/toast'
import type { Pet, PetFormData } from '@/types/pet'
import type { PetImageUploadResponse } from '@/lib/api/domains/pets/types'

// QUERY KEYS - Centralized for cache management
export const petKeys = {
    all: ['pets'] as const,
    detail: (id: string) => ['pets', id] as const,
    count: () => ['pets', 'count'] as const,
    signedUrl: (id: string) => ['pets', id, 'signed-url'] as const,

  }

// QUERIES (READ operations)
// Fetch all pets
export function usePets() {
    return useQuery({
      queryKey: petKeys.all,
      queryFn: async () => {
        const response = await petApi.getPets()
        return response.pets // Pet[]
      },
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
        retry: false,
    })
}

// Get pet count
export function usePetCount() {
    return useQuery({
        queryKey: petKeys.count(),
        queryFn: () => petApi.getPetCount(),
    })
  }

// MUTATIONS (WRITE operations)
// CREATE
export function useCreatePet() {
    const queryClient = useQueryClient()
  
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
        toastService.success('Pet created', `${newPet.name} has been added to your pets!`)
      },
      onError: (error) => {
        const appError = petErrorHandler(error)
        toastService.error('Failed to create pet', appError.message)
      },
    })
  }
  
// UPDATE 
export function useUpdatePet() {
    const queryClient = useQueryClient()
  
    return useMutation({
      mutationFn: ({ petId, petData }: { petId: string; petData: Partial<PetFormData> }) => {
        // Transform data
        const transformedData = {
          ...petData,
          weight: petData.weight ? petData.weight.replace(',', '.') : '',
        }
        return petApi.updatePet(petId, transformedData)
      },
      onSuccess: (updatedPet) => {
        // Invalidate both list and detail queries
        queryClient.invalidateQueries({ queryKey: petKeys.all })
        queryClient.invalidateQueries({ queryKey: petKeys.detail(updatedPet.id) })
        
        toastService.success('Pet updated', `${updatedPet.name}'s information has been updated!`)
      },
      onError: (error) => {
        const appError = petErrorHandler(error)
        toastService.error('Failed to update pet', appError.message)
      },
    })
  }

// DELETE (soft delete)
export function useDeletePet() {
    const queryClient = useQueryClient()
  
    return useMutation({
      mutationFn: (petId: string) => petApi.deletePet(petId),
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
      onError: (error, petId, context) => {
        // Rollback on error
        if (context?.previousPets) {
          queryClient.setQueryData(petKeys.all, context.previousPets)
        }
        
        const appError = petErrorHandler(error)
        toastService.error('Failed to delete pet', appError.message)
      },
      onSuccess: (_data, petId, context) => {
        // Get pet name from the snapshot for toast
        const deletedPet = context?.previousPets?.find((p) => p.id === petId);
        const petName = deletedPet?.name || 'Pet';
        
        toastService.success('Pet deleted', `${petName} has been removed.`)
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

    return useMutation({
      mutationFn: (file: File) => petApi.uploadPetImage(petId, file),
      onSuccess: (response: PetImageUploadResponse) => {
      // invalidate both list and detail so signed urls are refreshed
      queryClient.invalidateQueries({ queryKey: petKeys.all });
      queryClient.invalidateQueries({ queryKey: petKeys.detail(petId) });
      toastService.success('Photo updated', `Your pet's photo has been updated!`)
      },
      onError: (error) => {
        const appError = petErrorHandler(error);
        toastService.error('Failed to upload photo', appError.message)
      }
    })
  }

  // DELETE image
  export function useDeletePetImage(petId: string) {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: () => petApi.deletePetImage(petId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: petKeys.all });
        queryClient.invalidateQueries({ queryKey: petKeys.detail(petId) });
        queryClient.removeQueries({ queryKey: petKeys.signedUrl(petId) });
        toastService.success('Photo removed', `Your pet's photo has been removed.`);
      },
      onError: (error) => {
        const appError = petErrorHandler(error);
        toastService.error('Failed to remove photo', appError.message);
      },
    });
  }

// Helper: Get pet by ID from cache (no API call)
export function usePetFromCache(petId: string): Pet | undefined {
  const queryClient = useQueryClient()
  const pets = queryClient.getQueryData<Pet[]>(petKeys.all)
  return pets?.find((p) => p.id === petId)
}
