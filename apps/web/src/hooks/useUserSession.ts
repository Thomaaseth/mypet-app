import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { authErrorHandler } from '@/lib/errors/handlers';
import { User } from '@/types/auth';
import { AppError } from '@/lib/errors';

interface UserSessionState {
  user: User | null;
  isLoading: boolean;
  error: AppError | null;
}

interface UseUserSessionReturn extends UserSessionState {
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearSession: () => void;
}

interface UseUserSessionOptions {
  redirectOnError?: boolean;
  redirectTo?: string;
}

export function useUserSession(options: UseUserSessionOptions = {}): UseUserSessionReturn {
  const { redirectOnError = false, redirectTo = '/login' } = options;
  const router = useRouter();

  // Consolidated session state 
  const [state, setState] = useState<UserSessionState>({
    user: null,
    isLoading: true,
    error: null
  });

  // Internal session loading function
  const loadSession = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔍 Checking user session...');
      const sessionResponse = await authClient.getSession();
      
      if ('data' in sessionResponse && sessionResponse.data?.user) {
        const user = sessionResponse.data.user;
        
        setState({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            image: user.image,
          },
          isLoading: false,
          error: null
        });
        
        console.log('✅ User found:', user);
      } else {
        console.log('❌ No user found');
        
        setState({
          user: null,
          isLoading: false,
          error: null
        });

        if (redirectOnError) {
          router.push(redirectTo);
        }
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
      const appError = authErrorHandler(error);
      
      setState({
        user: null,
        isLoading: false,
        error: appError
      });

      if (redirectOnError) {
        router.push(redirectTo);
      }
    }
  }, [router, redirectOnError, redirectTo]);

  // Public refresh function - calls the internal loadSession
  const refreshSession = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  // Update user data without full refresh (for email updates etc.)
  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null
    }));
  }, []);

  // Clear session (for logout)
  const clearSession = useCallback(() => {
    setState({
      user: null,
      isLoading: false,
      error: null
    });
  }, []);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return {
    ...state,
    refreshSession,
    updateUser,
    clearSession,
  };
}