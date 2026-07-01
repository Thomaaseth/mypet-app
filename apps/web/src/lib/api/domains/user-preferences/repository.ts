import { get, put } from '../../base';
import type { UserPreferences, UserPreferencesFormData } from '@/types/user-preferences';

export class UserPreferencesRepository {
  async getUserPreferences(): Promise<UserPreferences | null> {
    const response = await get<{ preferences: UserPreferences | null }>(
      '/api/users/preferences'
    );
    return response.preferences;
  }

  async upsertUserPreferences(data: UserPreferencesFormData): Promise<UserPreferences> {
    const response = await put<{ preferences: UserPreferences }, UserPreferencesFormData>(
      '/api/users/preferences',
      data
    );
    return response.preferences;
  }
}

export const userPreferencesRepository = new UserPreferencesRepository();