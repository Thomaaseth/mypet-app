import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth-client'
import { authErrorHandler } from '@/lib/errors/handlers'
import type { User } from '@/types/auth'
import type { AppError } from '@/lib/errors'

// QUERY KEYS
export const sessionKeys = {
  current: ['session', 'current'] as const,
}

// QUERY (READ operation)
// Fetch current user session, returns user object or null if not authenticated
export function useSession() {
  return useQuery({
    queryKey: sessionKeys.current,
    queryFn: async () => {
      console.log('🔍 Checking user session...')
      const sessionResponse = await authClient.getSession()
      
      if ('data' in sessionResponse && sessionResponse.data?.user) {
        const user = sessionResponse.data.user
        console.log('✅ User found:', user)
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          image: user.image,
        } as User
      }
      
      console.log('❌ No user found')
      return null
    },
    retry: false, // Don't retry on auth failures
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  })
}

// MUTATIONS (WRITE operations)
// Logout mutation, clears session and removes user from cache
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Starting logout process...')
      const { error } = await authClient.signOut({})
      
      if (error) {
        throw error
      }
      
      console.log('✅ Logout successful')
    },
    onSuccess: () => {
      // Clear session from cache
      queryClient.setQueryData(sessionKeys.current, null)
      
      // Optionally clear all queries (nuclear option)
      // queryClient.clear()
    },
    onError: (error) => {
      const appError = authErrorHandler(error)
      console.error('❌ Logout failed:', appError.message)
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