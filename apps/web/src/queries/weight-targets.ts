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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Mutation hook - Upsert weight target
export function useUpsertWeightTarget(petId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetData: WeightTargetFormData) =>
      weightTargetApi.upsertWeightTarget(petId, targetData),
    onSuccess: (savedTarget) => {
      // Seed the cache from the mutation response — the PUT returns the
      // saved target in the same flat shape as the GET (no relations, no
      // computed fields), so no refetch is needed. setQueryData notifies
      // mounted observers: the chart's target zone updates synchronously.
      queryClient.setQueryData<WeightTarget | null>(
        weightTargetKeys.byPet(petId),
        savedTarget
      );

      // Deliberately NOT invalidating ['weights', petId]: WeightChart
      // receives the target as props from useWeightTarget — weight entries
      // data doesn't contain the target, so refetching it would re-download
      // identical data.

      toastService.success('Weight target saved successfully');
    },
    onError: (error) => {
      const appError = weightTargetErrorHandler(error);
      toastService.error(appError.message);
    },
  });
}

// Mutation hook - Delete weight target
export function useDeleteWeightTarget(petId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => weightTargetApi.deleteWeightTarget(petId),
    onSuccess: () => {
      // After a successful delete, the target is null BY DEFINITION — no
      // need to ask the server what we already know. Writing null notifies
      // observers, so the chart's target zone disappears immediately.
      queryClient.setQueryData<WeightTarget | null>(
        weightTargetKeys.byPet(petId),
        null
      );


      toastService.success('Weight target deleted successfully');
    },
    onError: (error) => {
      const appError = weightTargetErrorHandler(error);
      toastService.error(appError.message);
    },
  });
}