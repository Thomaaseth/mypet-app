import { 
  pgTable,
  pgEnum, 
  decimal, 
  date, 
  timestamp, 
  uuid,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { pets } from './pets';

export const weightEntries = pgTable('weight_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  weight: decimal('weight', { precision: 6, scale: 3 }).notNull(),
  date: date('date').notNull(), // Date of the weight entry (YYYY-MM-DD)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // One weight entry per pet per day, enforced by the DB (replaces the racy
  // application-level checkDuplicateDate). Also serves WHERE petId = ...
  // (leftmost prefix) and ORDER BY date per pet.
  petDateUnique: uniqueIndex('weight_entries_pet_id_date_unique').on(table.petId, table.date),
}));

export type WeightEntry = typeof weightEntries.$inferSelect;
export type NewWeightEntry = typeof weightEntries.$inferInsert;
export type WeightEntryFormData = Omit<NewWeightEntry, 'id' | 'petId' | 'createdAt' | 'updatedAt'>;