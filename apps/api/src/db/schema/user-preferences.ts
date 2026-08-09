import { 
    pgTable, 
    text, 
    timestamp, 
    uuid 
  } from 'drizzle-orm/pg-core';
  import { user } from './auth-schema';
    
  export const userPreferences = pgTable('user_preferences', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull().unique(),
    dateFormat: text('date_format').notNull().default('DMY'), // 'DMY' | 'MDY' numeric date field order only 
    timeFormat: text('time_format').notNull().default('24h'), // '24h' | '12h' clock format   
    language: text('language'), // 'en' | 'fr' | null,  null => not yet persisted, client i18n is source of truth
    unitSystem: text('unit_system').notNull().default('metric'), // 'metric' | 'imperial'
    timezone: text('timezone').notNull().default('UTC'), // IANA name, e.g. "Europe/Paris"
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  });
  
  // Types
  export type UserPreferences = typeof userPreferences.$inferSelect;
  export type NewUserPreferences = typeof userPreferences.$inferInsert;
  export type UserPreferencesFormData = Omit<NewUserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;