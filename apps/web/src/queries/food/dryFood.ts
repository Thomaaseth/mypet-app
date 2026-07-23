import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dryFoodApi, foodApi, foodErrorHandler } from '@/lib/api/domains/food'
import { toastService } from '@/lib/toast'
import type { DryFoodEntry, DryFoodFormData } from '@/types/food'
import { foodKeys } from './index'
import { buildFinishDateToastMessage } from '@/lib/utils/food-formatting'
import { useTranslation } from 'react-i18next'

// DRY FOOD QUERIES
// Fetch active dry food entries
export function useActiveDryFood(petId: string) {
  return useQuery({
    queryKey: foodKeys.dryActive(petId),
    queryFn: () => dryFoodApi.getDryFoodEntries(petId),
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
      const entries = await dryFoodApi.getFinishedDryFoodEntries(petId)
      // Sort by dateFinished DESC (most recent first)
      return entries.sort((a, b) => {
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
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (foodData: DryFoodFormData) => 
      dryFoodApi.createDryFoodEntry(petId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      toastService.success(t('food.dry.toastAddSuccess'))
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.dry.toastAddError'), appError.message)
    },
  })
}

export function useUpdateDryFood(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ foodId, foodData }: { 
      foodId: string
      foodData: Partial<DryFoodFormData> 
    }) => dryFoodApi.updateDryFoodEntry(petId, foodId, foodData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      toastService.success(t('food.dry.toastUpdateSuccess'))
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.dry.toastUpdateError'), appError.message)
    },
  })
}

export function useDeleteDryFood(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (foodId: string) => 
      foodApi.deleteFoodEntry(petId, foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.dryFinished(petId) })
      toastService.success(t('food.dry.toastDeleteSuccess'))
    },
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.dry.toastDeleteError'), appError.message)
    },
  })
}

export function useMarkDryFoodFinished(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (foodId: string) => 
      foodApi.markFoodAsFinished(petId, foodId),
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: foodKeys.dryActive(petId) })
      queryClient.invalidateQueries({ queryKey: foodKeys.dryFinished(petId) })
      toastService.success(
        updatedEntry.feedingStatus
          ? buildFinishDateToastMessage(updatedEntry, t)
          : t('food.dry.toastMarkFinishedFallback')
      )
    },   
    onError: (error) => {
      const appError = foodErrorHandler(error)
      toastService.error(t('food.shared.toastMarkFinishedError'), appError.message)
    },
  })
}

export function useUpdateDryFoodFinishDate(petId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ foodId, dateFinished }: { 
      foodId: string
      dateFinished: string 
    }) => foodApi.updateFinishDate(petId, foodId, dateFinished),
    onSuccess: (updatedEntry) => {
        queryClient.invalidateQueries({ queryKey: foodKeys.dryFinished(petId) })
  
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