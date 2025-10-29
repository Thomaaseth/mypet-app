import { 
  pgTable,
  pgEnum, 
  decimal, 
  date, 
  timestamp, 
  uuid
} from 'drizzle-orm/pg-core';
import { pets } from './pets';

export const weightUnitEnum = pgEnum('weight_unit', ['kg', 'lbs']);

export const weightEntries = pgTable('weight_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  weight: decimal('weight', { precision: 6, scale: 2 }).notNull(), // Weight value (e.g., 25.50 or 55.25)
  weightUnit: weightUnitEnum('weight_unit').notNull(),
  date: date('date').notNull(), // Date of the weight entry (YYYY-MM-DD)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type WeightEntry = typeof weightEntries.$inferSelect;
export type WeightUnit = typeof weightUnitEnum.enumValues[number];
export type NewWeightEntry = typeof weightEntries.$inferInsert;
export type WeightEntryFormData = Omit<NewWeightEntry, 'id' | 'petId' | 'createdAt' | 'updatedAt'>;