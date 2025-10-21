import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dryFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food'
import { toastService } from '@/lib/toast'
import type { DryFoodEntry, DryFoodFormData } from '@/types/food'
import { foodKeys } from './index'
import { calculateExpectedDays } from '@/lib/utils/food-formatting'

// DRY FOOD QUERIES
// Fetch active dry food entries
export function useActiveDryFood(petId: string) {
  return useQuery({
    queryKey: foodKeys.dryActive(petId),
    queryFn: async () => {
      const response = await dryFoodApi.getDryFoodEntries(petId)
      return response.foodEntries
    },
    enabled: !!petId,
    select: (data) => {
      // Calculate low stock entries
      const lowStock = data.filter(
        entry => entry.remainingDays !== undefined && 
                 entry.remainingDays <= 7 && 
                 entry.remainingDays > 0
      )
      
      return { entries: data, lowStock }
    },
  })
}

// Fetch finished dry food entries
export function useFinishedDryFood(petId: string) {
  return useQuery({
    queryKey: foodKeys.dryFinished(petId),
    queryFn: async () => {
      const response = await dryFoodApi.getFinishedDryFoodEntries(petId)
      // Sort by dateFinished DESC (most recent first)
      return response.foodEntries.sort((a, b) => {
        if (!a.dateFinished || !b.dateFinished) return 0
        return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime()
      })
    },
    enabled: !!petId,
  })
}

// DRY FOOD MUTATIONS
export function useCreateDryFood(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (foodData: DryFoodFormData) => 
      dryFoodApi.createDryFoodEntry(petId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      toastService.success('Dry food entry added successfully')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to add dry food', appError.message)
    },
  })
}

export function useUpdateDryFood(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ foodId, foodData }: { 
      foodId: string
      foodData: Partial<DryFoodFormData> 
    }) => dryFoodApi.updateDryFoodEntry(petId, foodId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      toastService.success('Dry food entry updated successfully')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to update dry food', appError.message)
    },
  })
}

export function useDeleteDryFood(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (foodId: string) => 
      foodApi.deleteFoodEntry(petId, foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.dryFinished(petId) })
      toastService.success('Dry food entry deleted successfully')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to delete dry food', appError.message)
    },
  })
}

export function useMarkDryFoodFinished(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (foodId: string) => 
      foodApi.markFoodAsFinished(petId, foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.dryFinished(petId) })
      toastService.success('Dry food marked as finished')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to mark as finished', appError.message)
    },
  })
}

export function useUpdateDryFoodFinishDate(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ foodId, dateFinished }: { 
      foodId: string
      dateFinished: string 
    }) => foodApi.updateFinishDate(petId, foodId, dateFinished),
    onSuccess: (updatedEntry) => {
      const dryEntry = updatedEntry as DryFoodEntry

      queryClient.invalidateQueries({ queryKey: foodKeys.dryFinished(petId) })
      
      // Show detailed toast with feeding status
      if (dryEntry.feedingStatus) {
        const expectedDays = calculateExpectedDays(dryEntry)
        const statusLabel = 
          dryEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' :
          dryEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' :
          dryEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' :
          dryEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' :
          'Normal feeding'
        
        toastService.success(
          `✅ Finished! Consumed in ${updatedEntry.actualDaysElapsed} days (expected ${expectedDays} days). Status: ${statusLabel}`
        )
      } else {
        toastService.success('Finish date updated successfully')
      }
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to update finish date', appError.message)
    },
  })
}