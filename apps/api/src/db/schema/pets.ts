import { 
  pgTable, 
  pgEnum, 
  text, 
  varchar, 
  boolean, 
  date, 
  timestamp, 
  uuid,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { sql } from 'drizzle-orm';

export const petGenderEnum = pgEnum('pet_gender', ['male', 'female']);
export const petAnimalTypeEnum = pgEnum('pet_animal_type', ['cat', 'dog']);

// Pets table
export const pets = pgTable('pets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  animalType: petAnimalTypeEnum('animal_type').notNull(), // REQUIRED
  species: varchar('species', { length: 50 }), // Optional
  gender: petGenderEnum('gender').notNull(),
  birthDate: date('birth_date'),
  isNeutered: boolean('is_neutered').default(false),
  microchipNumber: varchar('microchip_number', { length: 50 }),
  imageUrl: text('image_url'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true), // Soft delete flag
  isFavorite: boolean('is_favorite').notNull().default(false), // Pin one pet as the default tab on load
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('pets_user_id_idx').on(table.userId),
  // At most one favourite per user, enforced at the DB level
  // Partial: only favourite rows participate, so the many
  // is_favorite=false rows never collide. Mirrors the service transaction
  // that unsets the previous favourite before setting a new one.
  userFavoriteUnique: uniqueIndex('pets_user_id_favorite_unique')
    .on(table.userId)
    .where(sql`${table.isFavorite} = true`),
}));

// Types 
export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
export type PetGender = typeof petGenderEnum.enumValues[number];

// Computed types for API responses
export type PetFormData = Omit<NewPet, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>;