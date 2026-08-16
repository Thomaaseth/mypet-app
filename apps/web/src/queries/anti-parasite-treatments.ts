import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  antiParasiteTreatmentApi,
  antiParasiteTreatmentErrorHandler,
} from '@/lib/api/domains/anti-parasite-treatments';
import { toastService } from '@/lib/toast';
import { useTranslation } from 'react-i18next';
import type { AntiParasiteTreatment, AntiParasiteTreatmentFormData } from '@/types/anti-parasite-treatments';
import type { UpdateAntiParasiteTreatmentData } from '@/lib/validations/anti-parasite-treatment';

// QUERY KEYS - Centralized for cache management
export const antiParasiteKeys = {
  all: ['antiParasiteTreatments'] as const,
  byPet: (petId: string) => ['antiParasiteTreatments', 'pet', petId] as const,
  detail: (petId: string, treatmentId: string) =>
    ['antiParasiteTreatments', 'pet', petId, treatmentId] as const,
};

// QUERIES (READ operations)
interface UseAntiParasiteTreatmentsOptions {
  petId: string;
}

// Fetch all treatments for a pet. The list is the single source the master
// card, the 3 derived sub-cards, and the history all read from. 
// Sub-card derivation (most-recent-per-category) is done in the
// component from this same list, not here — this hook just returns the
// server list as-is (already newest-first + enriched with categories/expiry).
export function useAntiParasiteTreatments({ petId }: UseAntiParasiteTreatmentsOptions) {
  return useQuery({
    queryKey: antiParasiteKeys.byPet(petId),
    queryFn: () => antiParasiteTreatmentApi.getTreatments(petId),
    enabled: !!petId,
    staleTime: 30 * 60 * 1000, // 30 mins, same as weights
    refetchOnWindowFocus: true,
  });
}

// MUTATIONS (WRITE operations)
// CREATE
export function useCreateAntiParasiteTreatment(petId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: AntiParasiteTreatmentFormData) =>
      antiParasiteTreatmentApi.createTreatment(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: antiParasiteKeys.byPet(petId) });
      toastService.success(t('toasts.antiParasite.addSuccess'));
    },
    onError: (error) => {
      const appError = antiParasiteTreatmentErrorHandler(error);
      toastService.error(t('toasts.antiParasite.addError'), appError.message);
    },
  });
}

// UPDATE
export function useUpdateAntiParasiteTreatment(petId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      treatmentId,
      data,
    }: {
      treatmentId: string;
      data: UpdateAntiParasiteTreatmentData;
    }) => antiParasiteTreatmentApi.updateTreatment(petId, treatmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: antiParasiteKeys.byPet(petId) });
      toastService.success(t('toasts.antiParasite.updateSuccess'));
    },
    onError: (error) => {
      const appError = antiParasiteTreatmentErrorHandler(error);
      toastService.error(t('toasts.antiParasite.updateError'), appError.message);
    },
  });
}

// DELETE
export function useDeleteAntiParasiteTreatment(petId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (treatmentId: string) => antiParasiteTreatmentApi.deleteTreatment(petId, treatmentId),
    // Optimistic delete: cancel → snapshot → filter → rollback (onError) → invalidate (onSettled)
    onMutate: async (treatmentId) => {
      await queryClient.cancelQueries({ queryKey: antiParasiteKeys.byPet(petId) });

      const previousData = queryClient.getQueryData<AntiParasiteTreatment[]>(
        antiParasiteKeys.byPet(petId),
      );

      queryClient.setQueryData<AntiParasiteTreatment[]>(
        antiParasiteKeys.byPet(petId),
        (old) => old?.filter((treatment) => treatment.id !== treatmentId),
      );

      return { previousData };
    },
    onSuccess: () => {
      toastService.success(t('toasts.antiParasite.deleteSuccess'));
    },
    onError: (error, _treatmentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(antiParasiteKeys.byPet(petId), context.previousData);
      }
      const appError = antiParasiteTreatmentErrorHandler(error);
      toastService.error(t('toasts.antiParasite.deleteError'), appError.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: antiParasiteKeys.byPet(petId) });
    },
  });
}