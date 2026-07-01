import { db } from '../db';
import { userPreferences } from '../db/schema/user-preferences';
import { eq } from 'drizzle-orm';
import type { UserPreferences, NewUserPreferences } from '../db/schema/user-preferences';
import type { UserPreferencesFormData } from '@/shared/validations/locale';
import { BadRequestError } from '../middleware/errors';
import { dbLogger } from '../lib/logger';

export class UserPreferencesService {
  // Get preferences for a user (returns null if not yet set)
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      return preferences || null;
    } catch (error) {
      dbLogger.error({ err: error }, 'Error fetching user preferences');
      throw new BadRequestError('Failed to fetch user preferences');
    }
  }

  // Create or update preferences
  static async upsertUserPreferences(
    userId: string,
    data: UserPreferencesFormData
  ): Promise<UserPreferences> {
    try {
      const existing = await this.getUserPreferences(userId);

      // NEED REWORK DOWN THE LINE WITH TRUE SQL UPSERT .onConflictDoUpdate()
      if (existing) {
        const [updated] = await db
          .update(userPreferences)
          .set({
            locale: data.locale,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, userId))
          .returning();

        return updated;
      }

      const newPreferences: NewUserPreferences = {
        userId,
        locale: data.locale,
      };

      const [created] = await db
        .insert(userPreferences)
        .values(newPreferences)
        .returning();

      return created;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error upserting user preferences');
      throw new BadRequestError('Failed to save user preferences');
    }
  }
}