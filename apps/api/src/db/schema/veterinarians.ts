import { 
    pgTable, 
    text, 
    varchar, 
    boolean, 
    timestamp, 
    uuid
  } from 'drizzle-orm/pg-core';
  import { user } from './auth-schema';
  
  // Veterinarians table
  export const veterinarians = pgTable('veterinarians', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
    
    vetName: varchar('vet_name', { length: 100 }).notNull(),
    clinicName: varchar('clinic_name', { length: 100 }),
    
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 100 }),
    website: varchar('website', { length: 255 }),
    
    // Structured address fields
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    zipCode: varchar('zip_code', { length: 20 }).notNull(),
    
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(), // Soft delete flag
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  
  // Types
  export type Veterinarian = typeof veterinarians.$inferSelect;
  export type NewVeterinarian = typeof veterinarians.$inferInsert;
  export type VeterinarianFormData = Omit<NewVeterinarian, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>;
  
  
  