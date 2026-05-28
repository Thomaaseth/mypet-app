import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'
import { authClient } from '@/lib/auth-client'
import { authErrorHandler } from '@/lib/errors/handlers'
import { authLogger } from '@/lib/logger'
import type { User } from '@/types/auth'

// QUERY KEYS
export const sessionKeys = {
  current: ['session', 'current'] as const,
}

// QUERY (READ operation)
// Shared query options — used by both useSession and beforeLoad route guards
// ensures a single cache entry is reused everywhere
export const sessionQueryOptions = queryOptions({
  queryKey: sessionKeys.current,
  queryFn: async (): Promise<User | null> => {
    authLogger.debug('Checking user session');
    const sessionResponse = await authClient.getSession()

    if ('data' in sessionResponse && sessionResponse.data?.user) {
      const user = sessionResponse.data.user
      authLogger.debug('Session found', { userId: user.id });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        image: user.image,
      } satisfies User
    }

    authLogger.debug('No active session');
    return null
  },
  retry: false,
  staleTime: 1000 * 60 * 5,   // 5 minutes
  gcTime: 1000 * 60 * 10,      // 10 minutes
})

export function useSession() {
  return useQuery(sessionQueryOptions)
}

// MUTATIONS (WRITE operations)
// Logout mutation, clears session and removes user from cache
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      authLogger.info('Logout initiated');
      const { error } = await authClient.signOut({})
      
      if (error) {
        throw error
      }
      
      authLogger.info('Logout successful');
    },
    onSuccess: () => {
      // Clear session from cache
      queryClient.setQueryData(sessionKeys.current, null)
      
      queryClient.clear()
    },
    onError: (error) => {
      const appError = authErrorHandler(error)
      authLogger.error('Logout failed', { code: appError.code, message: appError.message });
    },
  })
}


// Update user in cache (for optimistic updates), used when user updates email or profile
export function useUpdateUserCache() {
  const queryClient = useQueryClient()

  return {
    updateUser: (updates: Partial<User>) => {
      queryClient.setQueryData<User | null>(
        sessionKeys.current,
        (oldUser) => {
          if (!oldUser) return null
          return { ...oldUser, ...updates }
        }
      )
    },
    clearUser: () => {
      queryClient.setQueryData(sessionKeys.current, null)
    },
  }
}

// Hook to manually refresh session
export function useRefreshSession() {
  const queryClient = useQueryClient()

  return {
    refreshSession: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionKeys.current })
    },
  }
}