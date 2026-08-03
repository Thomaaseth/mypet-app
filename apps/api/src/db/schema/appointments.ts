import { 
    pgTable, 
    pgEnum, 
    text, 
    varchar, 
    date,
    time,
    timestamp, 
    uuid,
    index
  } from 'drizzle-orm/pg-core';
  import { user } from './auth-schema';
  import { pets } from './pets';
  import { veterinarians } from './veterinarians';
  
  // Appointment type enum
  export const appointmentTypeEnum = pgEnum('appointment_type', [
    'checkup',
    'vaccination', 
    'surgery',
    'dental',
    'grooming',
    'emergency',
    'other'
  ]);
  
  // Appointments table
  export const appointments = pgTable('appointments', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
    petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
    veterinarianId: uuid('veterinarian_id').references(() => veterinarians.id, { onDelete: 'restrict' }).notNull(),
    
    // Appointment details
    appointmentDate: date('appointment_date').notNull(),
    appointmentTime: time('appointment_time').notNull(), // HH:MM:SS format
    appointmentType: appointmentTypeEnum('appointment_type').notNull(),
    
    // Split notes fields
    reasonForVisit: text('reason_for_visit'), // Before appointment, max 500 chars
    visitNotes: text('visit_notes'), // After appointment, max 1000 chars
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }, (table) => ({
    userIdIdx: index('appointments_user_id_idx').on(table.userId),
    petIdIdx: index('appointments_pet_id_idx').on(table.petId),
  }));
  
  // Types
  export type Appointment = typeof appointments.$inferSelect;
  export type NewAppointment = typeof appointments.$inferInsert;
  export type AppointmentType = typeof appointmentTypeEnum.enumValues[number];