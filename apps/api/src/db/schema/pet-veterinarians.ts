import { 
    pgTable, 
    boolean, 
    timestamp, 
    uuid
  } from 'drizzle-orm/pg-core';
  import { pets } from './pets';
  import { veterinarians } from './veterinarians';
  
  // Junction table relationship between pets and veterinarians
  export const petVeterinarians = pgTable('pet_veterinarians', {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
    veterinarianId: uuid('veterinarian_id').references(() => veterinarians.id, { onDelete: 'cascade' }).notNull(),
    
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  });
  
  // Types
  export type PetVeterinarian = typeof petVeterinarians.$inferSelect;
  export type NewPetVeterinarian = typeof petVeterinarians.$inferInsert;
  
  
  