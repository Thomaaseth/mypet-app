import {
    pgTable, 
    text, 
    varchar,
    timestamp,
    uuid,
    index,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'
import { pets } from './pets'

export const petNotes = pgTable('pet_notes', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade'}).notNull(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade'}).notNull(),
    content: varchar('content', { length: 200 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    petIdIdx: index('pet_notes_pet_id_idx').on(table.petId),
}));

// types
export type PetNote = typeof petNotes.$inferSelect;
export type NewPetNote = typeof petNotes.$inferInsert;