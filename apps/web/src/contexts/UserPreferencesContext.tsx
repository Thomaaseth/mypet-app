import { createContext, useContext, type ReactNode } from 'react';
import { useUserPreferences } from '@/queries/user-preferences';
import { getUnitsForLocale, type Locale, type LocaleUnits } from '@/shared/validations/locale';
import type { UserPreferences } from '@/types/user-preferences';
import type { AppError } from '@/lib/errors';
import { useSessionContext } from './SessionContext';

interface UserPreferencesContextValue {
  preferences: UserPreferences | null;
  locale: Locale | null;
  units: LocaleUnits | null;  // derived from locale — null => banner hasn't been completed yet
  hasPreferences: boolean;    // for banner visibility
  isLoading: boolean;
  error: AppError | null;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export function UserPreferencesProvider({ children }: UserPreferencesProviderProps) {
  const { user } = useSessionContext();
  const { data: preferences, isPending, error } = useUserPreferences({ enabled: !!user });

  const locale = preferences?.locale ?? null;
  const units = locale ? getUnitsForLocale(locale) : null;

  const appError: AppError | null = error
    ? { message: error.message, code: 'PREFERENCES_ERROR' }
    : null;

  const value: UserPreferencesContextValue = {
    preferences: preferences ?? null,
    locale,
    units,
    hasPreferences: preferences !== null,
    isLoading: isPending,
    error: appError,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within a UserPreferencesProvider');
  }
  return context;
}