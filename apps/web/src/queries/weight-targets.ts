import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weightTargetApi, weightTargetErrorHandler } from '@/lib/api/domains/weight-targets';
import type { WeightTarget, WeightTargetFormData } from '@/types/weight-targets';
import { toastService } from '@/lib/toast';

// Query keys
export const weightTargetKeys = {
  all: ['weight-targets'] as const,
  byPet: (petId: string) => ['weight-targets', petId] as const,
};

// Query hook - Get weight target for a pet
export function useWeightTarget(petId: string) {
  return useQuery({
    queryKey: weightTargetKeys.byPet(petId),
    queryFn: () => weightTargetApi.getWeightTarget(petId),
    enabled: !!petId,
    staleTime: Infinity, // WILL NEED TO TEST CACHE INVALIDATION / REFETCH
    refetchOnWindowFocus: true,
  });
}

// Mutation hook - Upsert weight target
export function useUpsertWeightTarget(petId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetData: WeightTargetFormData) =>
      weightTargetApi.upsertWeightTarget(petId, targetData),
    onSuccess: (data) => {
      // Invalidate and refetch weight target
      queryClient.invalidateQueries({ queryKey: weightTargetKeys.byPet(petId) });
      
      // Also invalidate weight entries (they may need to show the target on chart)
      queryClient.invalidateQueries({ queryKey: ['weights', petId] });

      toastService.success('Weight target saved successfully');
    },
    onError: (error) => {
      const appError = weightTargetErrorHandler(error);
      toastService.error(appError.message);
      console.error('Error upserting weight target:', error);
    },
  });
}

// Mutation hook - Delete weight target
export function useDeleteWeightTarget(petId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => weightTargetApi.deleteWeightTarget(petId),
    onSuccess: () => {
      // Invalidate and refetch weight target
      queryClient.invalidateQueries({ queryKey: weightTargetKeys.byPet(petId) });
      
      // Also invalidate weight entries (chart needs to update)
      queryClient.invalidateQueries({ queryKey: ['weights', petId] });

      toastService.success('Weight target deleted successfully');
    },
    onError: (error) => {
      const appError = weightTargetErrorHandler(error);
      toastService.error(appError.message);
      console.error('Error deleting weight target:', error);
    },
  });
}