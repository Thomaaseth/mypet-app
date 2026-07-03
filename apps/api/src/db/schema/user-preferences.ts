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
    locale: text('locale').notNull(),
    timezone: text('timezone').notNull().default('UTC'), // IANA name, e.g. "Europe/Paris"; default backfills existing rows only

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  
  // Types
  export type UserPreferences = typeof userPreferences.$inferSelect;
  export type NewUserPreferences = typeof userPreferences.$inferInsert;
  export type UserPreferencesFormData = Omit<NewUserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;