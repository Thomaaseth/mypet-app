import { 
    pgTable, 
    text, 
    timestamp, 
    uuid,
  } from 'drizzle-orm/pg-core';

export const allowedEmails = pgTable('allowed_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});