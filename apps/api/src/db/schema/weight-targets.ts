import { 
    pgTable,
    decimal, 
    timestamp, 
    uuid
  } from 'drizzle-orm/pg-core';
  import { pets } from './pets';
  import { weightUnitEnum } from './weight-entries';
  
  export const weightTargets = pgTable('weight_targets', {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull().unique(), // One target per pet
    minWeight: decimal('min_weight', { precision: 6, scale: 2 }).notNull(),
    maxWeight: decimal('max_weight', { precision: 6, scale: 2 }).notNull(),
    weightUnit: weightUnitEnum('weight_unit').notNull(), // Reuses existing enum
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  
  // Types
  export type WeightTarget = typeof weightTargets.$inferSelect;
  export type NewWeightTarget = typeof weightTargets.$inferInsert;
  export type WeightTargetFormData = Omit<NewWeightTarget, 'id' | 'petId' | 'createdAt' | 'updatedAt'>;