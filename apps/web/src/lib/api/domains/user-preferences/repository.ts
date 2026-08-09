import { get, put, patch } from '../../base';
import type { UserPreferences, UserPreferencesFormData } from '@/types/user-preferences';
import type { Language } from '@/shared/validations/language';

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

  async updateLanguage(language: Language): Promise<UserPreferences | null> {
    const response = await patch<{ preferences: UserPreferences | null }, { language: Language }>(
      '/api/users/preferences/language',
      { language }
    );
    return response.preferences;
  }
}

export const userPreferencesRepository = new UserPreferencesRepository();