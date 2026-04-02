import {
    pgTable, 
    text, 
    varchar,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'
import { pets } from './pets'

export const petNotes = pgTable('pet_notes', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade'}).notNull(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade'}).notNull(),
    content: varchar('content', { length: 200 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// types
export type PetNote = typeof petNotes.$inferSelect;
export type NewPetNote = typeof petNotes.$inferInsert;