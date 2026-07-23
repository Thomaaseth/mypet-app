import { createContext, useContext, type ReactNode } from 'react';
import { useUserPreferences } from '@/queries/user-preferences';
import type { DateTimeLocale } from '@/shared/validations/locale';
import type { UserPreferences } from '@/types/user-preferences';
import { getUnitsForSystem, type UnitSystem, type SystemUnits } from '@/shared/validations/units';
import type { AppError } from '@/lib/errors';
import { useSessionContext } from './SessionContext';

interface UserPreferencesContextValue {
  preferences: UserPreferences | null;
  dateTimeLocale: DateTimeLocale | null;
  unitSystem: UnitSystem | null;  // the user's raw stored preference, null => banner hasn't been completed yet
  units: SystemUnits | null;      // derived from unitSystem via getUnitsForSystem() ('kg', 'lbs', etc...)
  hasPreferences: boolean;        // for banner visibility
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

  const dateTimeLocale = preferences?.dateTimeLocale ?? null;
  const unitSystem = preferences?.unitSystem ?? null;
  const units = unitSystem ? getUnitsForSystem(unitSystem) : null;

  const appError: AppError | null = error
    ? { message: error.message, code: 'PREFERENCES_ERROR' }
    : null;

  const value: UserPreferencesContextValue = {
    preferences: preferences ?? null,
    dateTimeLocale,
    unitSystem,
    units,
    hasPreferences: !user || !!preferences,
    isLoading: !!user && isPending,
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