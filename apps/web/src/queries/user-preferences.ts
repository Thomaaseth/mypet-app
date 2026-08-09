import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userPreferencesApi, userPreferencesErrorHandler } from '@/lib/api/domains/user-preferences';
import { toastService } from '@/lib/toast';
import { useTranslation } from 'react-i18next';
import type { UserPreferences, UserPreferencesFormData } from '@/types/user-preferences';
import type { Language } from '@/shared/validations/language';

export const preferenceKeys = {
  all: ['user-preferences'] as const,
  current: () => ['user-preferences', 'current'] as const,
};

// Query — drives banner visibility: no data = banner shows
export function useUserPreferences({ enabled = true }: { enabled?: boolean } = {}) {
    return useQuery({
    queryKey: preferenceKeys.current(),
    queryFn: () => userPreferencesApi.getUserPreferences(),
    staleTime: Infinity, // only invalidate on mutation
    refetchOnWindowFocus: false,
    enabled,
  });
}

// Mutation — banner + profile both use this
export function useUpsertUserPreferences() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: UserPreferencesFormData) =>
      userPreferencesApi.upsertUserPreferences(data),
    onSuccess: (updatedPreferences: UserPreferences) => {
      // Update cache directly — no refetch needed
      queryClient.setQueryData(preferenceKeys.current(), updatedPreferences);
      toastService.success(t('toasts.preferences.saveSuccess'));
    },
    onError: (error) => {
      const appError = userPreferencesErrorHandler(error);
      toastService.error(appError.message);
    },
  });
}

// Language is written on its own from the footer switch. No success toast
// Pre-onboarding the API returns null (no row yet) — nothing to cache. 
// A logged-out toggle 401s, which we swallow since the client-side language change already applied.
export function useUpdateLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: Language) => userPreferencesApi.updateLanguage(language),
    onSuccess: (updated: UserPreferences | null) => {
      if (updated) {
        queryClient.setQueryData(preferenceKeys.current(), updated);
      }
    },
    onError: (error) => {
      const appError = userPreferencesErrorHandler(error);
      if (appError.code === 'UNAUTHORIZED') return;
      toastService.error(appError.message);
    },
  });
}