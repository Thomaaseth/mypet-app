import type { UserPreferencesRepository } from './repository';
import type { UserPreferences, UserPreferencesFormData } from '@/types/user-preferences';
import type { UserPreferencesError } from './types';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../../errors';

export class UserPreferencesService {
  constructor(private repository: UserPreferencesRepository) {}

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      return await this.repository.getUserPreferences();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async upsertUserPreferences(data: UserPreferencesFormData): Promise<UserPreferences> {
    try {
      return await this.repository.upsertUserPreferences(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  mapError(error: unknown): UserPreferencesError {
    if (error instanceof ValidationError) {
      return { message: error.message, code: error.code };
    }
    if (error instanceof NotFoundError) {
      return { message: 'Preferences not found', code: 'NOT_FOUND' };
    }
    if (error instanceof UnauthorizedError) {
      return { message: 'You must be logged in', code: 'UNAUTHORIZED' };
    }
    if (error instanceof ForbiddenError) {
      return { message: 'Access denied', code: 'FORBIDDEN' };
    }
    if (error instanceof ApiError) {
      return { message: error.message, code: error.code };
    }
    return { message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' };
  }

  private handleError(error: unknown): Error {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof ApiError
    ) {
      return error;
    }
    return new ApiError('An unexpected error occurred');
  }
}