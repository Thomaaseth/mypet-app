import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useUserPreferences } from '@/queries/user-preferences';
import type { DateFormat } from '@/shared/validations/date-format';
import type { TimeFormat } from '@/shared/validations/time-format';
import type { UserPreferences } from '@/types/user-preferences';
import { getUnitsForSystem, type UnitSystem, type SystemUnits } from '@/shared/validations/units';
import type { AppError } from '@/lib/errors';
import { useSessionContext } from './SessionContext';
import { useTranslation } from 'react-i18next';

interface UserPreferencesContextValue {
  preferences: UserPreferences | null;
  dateFormat: DateFormat | null; // raw stored preference, null => banner not completed
  timeFormat: TimeFormat | null;
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

  const { i18n } = useTranslation();

  // Hydrate UI language from the stored preference when it loads (cross-device).
  // Client-only changeLanguage — deliberately does NOT go through the persisting
  // setLanguage, so there's no redundant PATCH and no loop.
  useEffect(() => {
    const serverLanguage = preferences?.language;
    if (serverLanguage && serverLanguage !== i18n.language) {
      void i18n.changeLanguage(serverLanguage);
    }
  }, [preferences?.language, i18n]);

  const dateFormat = preferences?.dateFormat ?? null;
  const timeFormat = preferences?.timeFormat ?? null;
  const unitSystem = preferences?.unitSystem ?? null;
  const units = unitSystem ? getUnitsForSystem(unitSystem) : null;

  const appError: AppError | null = error
    ? { message: error.message, code: 'PREFERENCES_ERROR' }
    : null;

  const value: UserPreferencesContextValue = {
    preferences: preferences ?? null,
    dateFormat,
    timeFormat,
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