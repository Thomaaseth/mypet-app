import { 
  pgTable, 
  pgEnum, 
  text, 
  varchar, 
  decimal, 
  boolean, 
  date, 
  timestamp, 
  uuid
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const petGenderEnum = pgEnum('pet_gender', ['male', 'female', 'unknown']);
export const weightUnitEnum = pgEnum('weight_unit', ['kg', 'lbs']);
export const petAnimalTypeEnum = pgEnum('pet_animal_type', ['cat', 'dog']);

// Pets table
export const pets = pgTable('pets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  animalType: petAnimalTypeEnum('animal_type').notNull(), // REQUIRED
  species: varchar('species', { length: 50 }), // Optional
  gender: petGenderEnum('gender').default('unknown'),
  birthDate: date('birth_date'),
  weight: decimal('weight', { precision: 6, scale: 2 }), // Weight value (e.g., 25.50 or 55.25)
  weightUnit: weightUnitEnum('weight_unit').default('kg'), // Unit: kg or lbs
  isNeutered: boolean('is_neutered').default(false),
  microchipNumber: varchar('microchip_number', { length: 50 }),
  imageUrl: text('image_url'), // Placeholder 
  notes: text('notes'),
  isActive: boolean('is_active').default(true), // Soft delete flag
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Types for TypeScript
export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;
export type PetGender = typeof petGenderEnum.enumValues[number];
export type WeightUnit = typeof weightUnitEnum.enumValues[number];

// Computed types for API responses
export type PetFormData = Omit<NewPet, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>;