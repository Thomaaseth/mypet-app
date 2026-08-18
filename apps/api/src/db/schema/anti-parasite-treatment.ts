import {
  pgTable,
  pgEnum,
  varchar,
  integer,
  date,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { pets } from './pets';
import type {
  AntiParasiteCategory,
  AntiParasiteDurationUnit,
} from '@/shared/validations/anti-parasite-treatment';

// Enum values are sourced conceptually from the shared validation module
// (ANTI_PARASITE_CATEGORIES / ANTI_PARASITE_DURATION_UNITS)
export const antiParasiteCategoryEnum = pgEnum('anti_parasite_category', [
  'fleas_ticks',
  'worms',
  'heartworm',
]);

export const antiParasiteDurationUnitEnum = pgEnum('anti_parasite_duration_unit', [
  'weeks',
  'months',
]);

// Compile-time drift guards: the pgEnum value unions must exactly match the
// shared Zod-derived types
type _CategoryEnumMatches =
  (typeof antiParasiteCategoryEnum.enumValues)[number] extends AntiParasiteCategory
    ? AntiParasiteCategory extends (typeof antiParasiteCategoryEnum.enumValues)[number]
      ? true
      : never
    : never;
type _DurationUnitEnumMatches =
  (typeof antiParasiteDurationUnitEnum.enumValues)[number] extends AntiParasiteDurationUnit
    ? AntiParasiteDurationUnit extends (typeof antiParasiteDurationUnitEnum.enumValues)[number]
      ? true
      : never
    : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _categoryEnumMatches: _CategoryEnumMatches = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _durationUnitEnumMatches: _DurationUnitEnumMatches = true;

// One record per administration event. Categories are NOT
// stored here; they live in the join table below, one row per tagged
// category, so a single administration tagged with 3 categories is 1 row
// here + 3 rows there. Expiry ("protected until") is NOT stored: it's
// computed on read from dateAdministered + durationUnit/durationAmount.
export const antiParasiteTreatments = pgTable('anti_parasite_treatments', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  productName: varchar('product_name', { length: 50 }).notNull(),
  durationUnit: antiParasiteDurationUnitEnum('duration_unit').notNull(),
  durationAmount: integer('duration_amount').notNull(),
  dateAdministered: date('date_administered').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Main access path: "all treatments for pet X", also serves the per-pet
  // ORDER BY date_administered for history + sub-card most-recent lookups.
  petIdIdx: index('anti_parasite_treatments_pet_id_idx').on(table.petId),
}));

// Junction table: which categories a given treatment record covers.
// Deleting a treatment cascades away its category rows.
export const antiParasiteTreatmentCategories = pgTable('anti_parasite_treatment_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  treatmentId: uuid('treatment_id')
    .references(() => antiParasiteTreatments.id, { onDelete: 'cascade' })
    .notNull(),
  category: antiParasiteCategoryEnum('category').notNull(),
}, (table) => ({
  // A category can be tagged on a treatment at most once. DB-level guard
  // (vs a racy check), also serves WHERE treatmentId = ... via leftmost prefix.
  treatmentCategoryUnique: uniqueIndex(
    'anti_parasite_treatment_categories_treatment_id_category_unique',
  ).on(table.treatmentId, table.category),
  // Reverse lookup: "most recent treatment covering category X for this pet"
  // filters on category; this indexes that access path + the cascade.
  categoryIdx: index('anti_parasite_treatment_categories_category_idx').on(table.category),
}));

// Types
export type AntiParasiteTreatment = typeof antiParasiteTreatments.$inferSelect;
export type NewAntiParasiteTreatment = typeof antiParasiteTreatments.$inferInsert;
export type AntiParasiteTreatmentCategoryRow = typeof antiParasiteTreatmentCategories.$inferSelect;
export type NewAntiParasiteTreatmentCategoryRow =
  typeof antiParasiteTreatmentCategories.$inferInsert;