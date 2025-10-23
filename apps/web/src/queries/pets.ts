import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { petApi, petErrorHandler } from '@/lib/api/pets'
import { toastService } from '@/lib/toast'
import type { Pet, PetFormData } from '@/types/pet'

// QUERY KEYS - Centralized for cache management
export const petKeys = {
    all: ['pets'] as const,
    detail: (id: string) => ['pets', id] as const,
    count: () => ['pets', 'count'] as const,
  }

// QUERIES (READ operations)
// Fetch all pets
export function usePets() {
    return useQuery({
      queryKey: petKeys.all,
      queryFn: async () => {
        const response = await petApi.getPets()
        return response.pets
      },
    })
  }

// Fetch pet by ID
export function usePet(petId: string) {
    return useQuery({
        queryKey: petKeys.detail(petId),
        queryFn: () => petApi.getPetById(petId),
        enabled: petId.length > 0, // only run if petId exists
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
          weight: petData.weight ? petData.weight.replace(',', '.') : ''
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
            previousPets.filter(pet => pet.id !== petId)
          )
        }
  
        // Return context with previous data for rollback
        return { previousPets }
      },
      onSuccess: (_data, petId, context) => {
        // Get pet name from cache (for toast)
        const deletedPet = context?.previousPets?.find(p => p.id === petId);
        const petName = deletedPet?.name || 'Pet';
        
        toastService.success('Pet deleted', `${petName} has been removed from your pets.`)

        // Only invalidate on success
        queryClient.invalidateQueries({ queryKey: petKeys.all })
      },
      onError: (error, _petId, context) => {
        // Rollback on error
        if (context?.previousPets) {
          queryClient.setQueryData(petKeys.all, context.previousPets)
        }
        
        const appError = petErrorHandler(error)
        toastService.error('Failed to delete pet', appError.message)
      },
    })
  }
  

// Helper: Get pet by ID from cache (no API call)
export function usePetFromCache(petId: string): Pet | undefined {
    const queryClient = useQueryClient()
    const pets = queryClient.getQueryData<Pet[]>(petKeys.all)
    return pets?.find(pet => pet.id === petId)
  }