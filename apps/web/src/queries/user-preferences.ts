import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userPreferencesApi, userPreferencesErrorHandler } from '@/lib/api/domains/user-preferences';
import { toastService } from '@/lib/toast';
import type { UserPreferences, UserPreferencesFormData } from '@/types/user-preferences';

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

  return useMutation({
    mutationFn: (data: UserPreferencesFormData) =>
      userPreferencesApi.upsertUserPreferences(data),
    onSuccess: (updatedPreferences: UserPreferences) => {
      // Update cache directly — no refetch needed
      queryClient.setQueryData(preferenceKeys.current(), updatedPreferences);
      toastService.success('Preferences saved successfully');
    },
    onError: (error) => {
      const appError = userPreferencesErrorHandler(error);
      toastService.error(appError.message);
    },
  });
}