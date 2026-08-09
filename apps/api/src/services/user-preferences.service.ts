import { db } from '../db';
import { userPreferences } from '../db/schema/user-preferences';
import { eq } from 'drizzle-orm';
import type { UserPreferences, NewUserPreferences } from '../db/schema/user-preferences';
import type { UserPreferencesFormData } from '@/shared/validations/user-preferences';
import { BadRequestError } from '../middleware/errors';
import { dbLogger } from '../lib/logger';
import { toDateString } from '@/shared/utils/dates';
import type { Language } from '@/shared/validations/language';

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
      // APPLIES ELSWHERE IN THE CODE BASE
      if (existing) {
        const [updated] = await db
          .update(userPreferences)
          .set({
            dateFormat: data.dateFormat,
            timeFormat: data.timeFormat,
            unitSystem: data.unitSystem,
            timezone: data.timezone,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, userId))
          .returning();

        return updated;
      }

      const newPreferences: NewUserPreferences = {
        userId,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        unitSystem: data.unitSystem,
        timezone: data.timezone,
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

  // Persist the UI language independently of the banner/profile form.
  // UPDATE-only by design: before onboarding no row exists, so this is a no-op
  // (returns null) and client-side i18n stays the source of truth. Once a row
  // exists the stored value is authoritative and is hydrated on load.
  static async updateLanguage(
    userId: string,
    language: Language
  ): Promise<UserPreferences | null> {
    try {
      const [updated] = await db
        .update(userPreferences)
        .set({ language, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();

      return updated ?? null;
    } catch (error) {
      dbLogger.error({ err: error }, 'Error updating language preference');
      throw new BadRequestError('Failed to update language preference');
    }
  }

  // Server-authoritative "today" for a user, anchored to their stored IANA timezone.
  // Falls back to server-UTC-today only when the user has no preferences row yet
  // (never persisted, see schema comment on why the DB column default is migration-only).
  static async getTodayForUser(userId: string): Promise<string> {
    const preferences = await this.getUserPreferences(userId);

    if (!preferences) {
      return toDateString(new Date());
    }

    // en-CA locale formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone: preferences.timezone }).format(new Date());
  }
}

// NOTE: THERE ARE NO RESYNC MECHANISM IN PLACE RIGHT NOW. TIMEZONE IS SET AND FORGET
// USER ISN'T ABLE TO CHANGE MANUALLY 

