import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wetFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food'
import { toastService } from '@/lib/toast'
import type { WetFoodFormData } from '@/types/food'
import { foodKeys } from './index'
import { buildFinishDateToastMessage } from '@/lib/utils/food-formatting'
import { useTranslation } from 'react-i18next'

// WET FOOD QUERIES
// Fetch active wet food entries

export function useActiveWetFood(petId: string) {
  return useQuery({
    queryKey: foodKeys.wetActive(petId),
    queryFn: () => wetFoodApi.getWetFoodEntries(petId),
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
      const entries = await wetFoodApi.getFinishedWetFoodEntries(petId)
      // Sort by dateFinished DESC
      return entries.sort((a, b) => {
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (foodData: WetFoodFormData) => 
      wetFoodApi.createWetFoodEntry(petId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      toastService.success(t('food.wet.toastAddSuccess'))
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.wet.toastAddError'), appError.message)
    },
  })
}

export function useUpdateWetFood(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ foodId, foodData }: { 
      foodId: string
      foodData: Partial<WetFoodFormData> 
    }) => wetFoodApi.updateWetFoodEntry(petId, foodId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      toastService.success(t('food.wet.toastUpdateSuccess'))
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.wet.toastUpdateError'), appError.message)
    },
  })
}

export function useDeleteWetFood(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (foodId: string) => 
      foodApi.deleteFoodEntry(petId, foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.wetFinished(petId) })
      toastService.success(t('food.wet.toastDeleteSuccess'))
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.wet.toastDeleteError'), appError.message)
    },
  })
}

export function useMarkWetFoodFinished(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (foodId: string) => 
        foodApi.markFoodAsFinished(petId, foodId),
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.wetFinished(petId) })
      toastService.success(
        updatedEntry.feedingStatus
          ? buildFinishDateToastMessage(updatedEntry, t)
          : t('food.wet.toastMarkFinishedFallback')
      )    
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.shared.toastMarkFinishedError'), appError.message)
    },
  })
}

export function useUpdateWetFoodFinishDate(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ foodId, dateFinished }: { 
      foodId: string
      dateFinished: string 
    }) => foodApi.updateFinishDate(petId, foodId, dateFinished),
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: foodKeys.wetFinished(petId) })

      toastService.success(
        updatedEntry.feedingStatus
          ? buildFinishDateToastMessage(updatedEntry, t)
          : t('food.shared.toastFinishDateUpdatedFallback')
      )
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.shared.toastUpdateFinishDateError'), appError.message)
    },
  })
}