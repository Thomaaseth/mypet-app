import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { weightApi, weightErrorHandler } from '@/lib/api/domains/weights'
import { toastService } from '@/lib/toast'
import type { 
  WeightEntry, 
  WeightFormData, 
  WeightChartData 
} from '@/types/weights'
import type { WeightUnit } from '@/types/pet'
import { formatDateForDisplay } from '@/lib/validations/weight'

// QUERY KEYS - Centralized for cache management
export const weightKeys = {
  all: ['weights'] as const,
  byPet: (petId: string) => ['weights', 'pet', petId] as const,
  detail: (petId: string, weightId: string) => ['weights', 'pet', petId, weightId] as const,
}


// QUERIES (READ operations)
interface UseWeightEntriesOptions {
  petId: string;
}


 // Fetch all weight entries for a pet, returns sorted entries and chart data
export function useWeightEntries({ petId }: UseWeightEntriesOptions) {
  return useQuery({
    queryKey: weightKeys.byPet(petId),
    queryFn: async () => {
      const response = await weightApi.getWeightEntries(petId)
      return response.weightEntries
    },
    enabled: !!petId, // Only run if petId exists
    select: (data) => {
      // Sort entries (oldest to newest for chart)
      const sortedEntries = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Convert to chart data format
      const chartData: WeightChartData[] = sortedEntries.map(entry => ({
        date: formatDateForDisplay(entry.date),
        weight: parseFloat(entry.weight),
        originalDate: entry.date,
      }))

      const latestWeight = sortedEntries.length > 0 
        ? sortedEntries[sortedEntries.length - 1] 
        : null

      return {
        weightEntries: sortedEntries,
        chartData,
        latestWeight,
      }
    },
  })
}

// MUTATIONS (WRITE operations)
// CREATE
export function useCreateWeightEntry(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (weightData: WeightFormData) => 
      weightApi.createWeightEntry(petId, weightData),
    onSuccess: () => {
      // Invalidate weight entries for this pet
      queryClient.invalidateQueries({ queryKey: weightKeys.byPet(petId) })
      
      toastService.success('Weight entry added successfully')
    },
    onError: (error) => {
      const appError = weightErrorHandler(error)
      toastService.error('Failed to add weight entry', appError.message)
    },
  })
}

// UPDATE
export function useUpdateWeightEntry(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ weightId, weightData }: { 
      weightId: string; 
      weightData: Partial<WeightFormData> 
    }) => weightApi.updateWeightEntry(petId, weightId, weightData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightKeys.byPet(petId) })
      
      toastService.success('Weight entry updated successfully')
    },
    onError: (error) => {
      const appError = weightErrorHandler(error)
      toastService.error('Failed to update weight entry', appError.message)
    },
  })
}

// DELETE
export function useDeleteWeightEntry(petId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (weightId: string) => 
      weightApi.deleteWeightEntry(petId, weightId),
    onMutate: async (weightId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: weightKeys.byPet(petId) })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(weightKeys.byPet(petId))

      // Optimistically remove entry from cache
      queryClient.setQueryData<WeightEntry[]>(
        weightKeys.byPet(petId),
        (old) => old?.filter(entry => entry.id !== weightId)
      )

      // Return context for rollback
      return { previousData }
    },
    onSuccess: () => {
      toastService.success('Weight entry deleted successfully')
    },
    onError: (error, _weightId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(weightKeys.byPet(petId), context.previousData)
      }
      
      const appError = weightErrorHandler(error)
      toastService.error('Failed to delete weight entry', appError.message)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: weightKeys.byPet(petId) })
    },
  })
}