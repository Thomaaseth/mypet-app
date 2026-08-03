import { 
    pgTable, 
    boolean, 
    timestamp, 
    uuid,
    index,
    uniqueIndex
  } from 'drizzle-orm/pg-core';
  import { pets } from './pets';
  import { veterinarians } from './veterinarians';
  
  // Junction table relationship between pets and veterinarians
  export const petVeterinarians = pgTable('pet_veterinarians', {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
    veterinarianId: uuid('veterinarian_id').references(() => veterinarians.id, { onDelete: 'cascade' }).notNull(),
    
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  }, (table) => ({
    // A pet-vet assignment is inherently unique. Enforces no duplicate
    // assignment (DB-level, vs the racy delete-then-insert) and serves
    // WHERE petId = ... via leftmost prefix.
    petVetUnique: uniqueIndex('pet_veterinarians_pet_id_veterinarian_id_unique').on(table.petId, table.veterinarianId),
    // Reverse lookups: "which pets use this vet" + the cascade on vet delete.
    veterinarianIdIdx: index('pet_veterinarians_veterinarian_id_idx').on(table.veterinarianId),
  }));
  
  // Types
  export type PetVeterinarian = typeof petVeterinarians.$inferSelect;
  export type NewPetVeterinarian = typeof petVeterinarians.$inferInsert;