import { createContext, useContext, ReactNode } from 'react';
import { useSession, useUpdateUserCache, useRefreshSession } from '@/queries/session';
import type { User } from '@/types/auth';
import type { AppError } from '@/lib/errors';

interface SessionContextValue {
  user: User | null;
  isLoading: boolean;
  error: AppError | null;
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  // Use TanStack Query for session
  const { data: user, isPending, error } = useSession();
  const { updateUser, clearUser } = useUpdateUserCache();
  const { refreshSession } = useRefreshSession();

  // Transform error to AppError format
  const appError: AppError | null = error 
    ? { message: error.message, code: 'SESSION_ERROR' }
    : null;

  const value: SessionContextValue = {
    user: user ?? null,
    isLoading: isPending,
    error: appError,
    refreshSession,
    updateUser,
    clearSession: clearUser,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
