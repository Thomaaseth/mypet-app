import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import type { CookieConsentChoices } from '@/shared/validations/cookie-consent';

// Audit trail proving consent was obtained. Never updated once written: each
// consent action inserts a new row rather than mutating
export const cookieConsentLog = pgTable('cookie_consent_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Client-generated correlation id: persisted client-side (localStorage)
  // alongside the consent choice, so events from the same anonymous browser
  // can be correlated
  consentId: text('consent_id').notNull(),
  // Null for anonymous visitors
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  choices: jsonb('choices').notNull().$type<CookieConsentChoices>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CookieConsentLogEntry = typeof cookieConsentLog.$inferSelect;
export type NewCookieConsentLogEntry = typeof cookieConsentLog.$inferInsert;