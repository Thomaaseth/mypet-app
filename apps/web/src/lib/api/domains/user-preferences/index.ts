import { UserPreferencesService } from './service';
import { userPreferencesRepository } from './repository';
import type { UserPreferencesFormData } from '@/types/user-preferences';

const userPreferencesService = new UserPreferencesService(userPreferencesRepository);

export const userPreferencesApi = {
  getUserPreferences: () => userPreferencesService.getUserPreferences(),
  upsertUserPreferences: (data: UserPreferencesFormData) =>
    userPreferencesService.upsertUserPreferences(data),
};

export const userPreferencesErrorHandler = (error: unknown) =>
  userPreferencesService.mapError(error);

export type { UserPreferencesApiResponse, UserPreferencesError } from './types';
export { UserPreferencesRepository } from './repository';
export { UserPreferencesService } from './service';