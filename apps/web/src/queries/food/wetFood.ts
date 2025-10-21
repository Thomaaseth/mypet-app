import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wetFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food'
import { toastService } from '@/lib/toast'
import type { WetFoodEntry, WetFoodFormData } from '@/types/food'
import { foodKeys } from './index'
import { calculateExpectedDays } from '@/lib/utils/food-formatting'
import { dryFoodSchema } from '@/lib/validations/food'

// WET FOOD QUERIES
// Fetch active wet food entries

export function useActiveWetFood(petId: string) {
  return useQuery({
    queryKey: foodKeys.wetActive(petId),
    queryFn: async () => {
      const response = await wetFoodApi.getWetFoodEntries(petId)
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


// Fetch finished wet food entries
export function useFinishedWetFood(petId: string) {
  return useQuery({
    queryKey: foodKeys.wetFinished(petId),
    queryFn: async () => {
      const response = await wetFoodApi.getFinishedWetFoodEntries(petId)
      // Sort by dateFinished DESC
      return response.foodEntries.sort((a, b) => {
        if (!a.dateFinished || !b.dateFinished) return 0
        return new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime()
      })
    },
    enabled: !!petId,
  })
}

// WET FOOD MUTATIONS
export function useCreateWetFood(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (foodData: WetFoodFormData) => 
      wetFoodApi.createWetFoodEntry(petId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      toastService.success('Wet food entry added successfully')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to add wet food', appError.message)
    },
  })
}

export function useUpdateWetFood(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ foodId, foodData }: { 
      foodId: string
      foodData: Partial<WetFoodFormData> 
    }) => wetFoodApi.updateWetFoodEntry(petId, foodId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      toastService.success('Wet food entry updated successfully')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to update wet food', appError.message)
    },
  })
}

export function useDeleteWetFood(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (foodId: string) => 
      foodApi.deleteFoodEntry(petId, foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.wetFinished(petId) })
      toastService.success('Wet food entry deleted successfully')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to delete wet food', appError.message)
    },
  })
}

export function useMarkWetFoodFinished(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (foodId: string) => 
        foodApi.markFoodAsFinished(petId, foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.wetFinished(petId) })
      toastService.success('Wet food marked as finished')
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error('Failed to mark as finished', appError.message)
    },
  })
}

export function useUpdateWetFoodFinishDate(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ foodId, dateFinished }: { 
      foodId: string
      dateFinished: string 
    }) => foodApi.updateFinishDate(petId, foodId, dateFinished),
    onSuccess: (updatedEntry) => {
      const wetEntry = updatedEntry as WetFoodEntry

      queryClient.invalidateQueries({ queryKey: foodKeys.wetFinished(petId) })
      
      // Show detailed toast
      if (wetEntry.feedingStatus) {
        const expectedDays = calculateExpectedDays(wetEntry)
        const statusLabel = 
          wetEntry.feedingStatus === 'overfeeding' ? 'Overfeeding' :
          wetEntry.feedingStatus === 'slightly-over' ? 'Slightly Over' :
          wetEntry.feedingStatus === 'underfeeding' ? 'Underfeeding' :
          wetEntry.feedingStatus === 'slightly-under' ? 'Slightly Under' :
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