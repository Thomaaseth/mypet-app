'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useUserSession } from '@/hooks/useUserSession';
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
  // Single instance of useUserSession at the root level
  const session = useUserSession();

  return (
    <SessionContext.Provider value={session}>
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
