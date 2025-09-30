// apps/api/src/db/schema/food.ts
import { 
  pgTable, 
  pgEnum, 
  varchar, 
  decimal,
  integer,
  boolean, 
  date, 
  timestamp, 
  uuid,
  check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { pets } from './pets';

// Simplified enums
export const foodTypeEnum = pgEnum('food_type', ['dry', 'wet']);
export const dryFoodBagUnitEnum = pgEnum('dry_food_bag_unit', ['kg', 'pounds']);
export const dryFoodDailyUnitEnum = pgEnum('dry_food_daily_unit', ['grams', 'cups']);
export const wetFoodUnitEnum = pgEnum('wet_food_unit', ['grams', 'oz']);

export const foodEntries = pgTable('food_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  foodType: foodTypeEnum('food_type').notNull(),
  
  // Common fields
  brandName: varchar('brand_name', { length: 100 }),
  productName: varchar('product_name', { length: 150 }),
  dailyAmount: decimal('daily_amount', { precision: 8, scale: 2 }).notNull(),
  dateStarted: date('date_started').notNull(),
  
  // DRY FOOD ONLY
  bagWeight: decimal('bag_weight', { precision: 8, scale: 2 }),
  bagWeightUnit: dryFoodBagUnitEnum('bag_weight_unit'),
  dryDailyAmountUnit: dryFoodDailyUnitEnum('dry_daily_amount_unit'),
  
  // WET FOOD ONLY
  numberOfUnits: integer('number_of_units'),
  weightPerUnit: decimal('weight_per_unit', { precision: 8, scale: 2 }),
  wetWeightUnit: wetFoodUnitEnum('wet_weight_unit'),
  wetDailyAmountUnit: wetFoodUnitEnum('wet_daily_amount_unit'),
  
  // STATUS FIELDS
  isActive: boolean('is_active').default(true).notNull(),
  dateFinished: date('date_finished'),  // ← NEW

  // TIMESTAMPS
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Database constraints
dryFoodConstraint: check('dry_food_check', sql`
  (food_type != 'dry' OR (
   bag_weight IS NOT NULL AND 
   bag_weight_unit IS NOT NULL AND 
   dry_daily_amount_unit IS NOT NULL AND
   number_of_units IS NULL AND 
   weight_per_unit IS NULL AND 
   wet_weight_unit IS NULL AND
   wet_daily_amount_unit IS NULL))
`),

wetFoodConstraint: check('wet_food_check', sql`
  (food_type != 'wet' OR (
   number_of_units IS NOT NULL AND 
   weight_per_unit IS NOT NULL AND 
   wet_weight_unit IS NOT NULL AND
   wet_daily_amount_unit IS NOT NULL AND
   bag_weight IS NULL AND 
   bag_weight_unit IS NULL AND
   dry_daily_amount_unit IS NULL))
`),
}));

export const foodEntriesRelations = relations(foodEntries, ({ one }) => ({
  pet: one(pets, {
    fields: [foodEntries.petId],
    references: [pets.id],
  }),
}));

export type BaseFoodEntry = {
  id: string;
  petId: string;
  brandName: string | null;
  productName: string | null;
  dailyAmount: string;
  dateStarted: string;
  dateFinished: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DryFoodEntry = BaseFoodEntry & {
  foodType: 'dry';
  bagWeight: string;
  bagWeightUnit: 'kg' | 'pounds';
  dryDailyAmountUnit: 'grams' | 'cups';
  // Wet fields are null
  numberOfUnits: null;
  weightPerUnit: null;
  wetWeightUnit: null;
  wetDailyAmountUnit: null;
};

export type WetFoodEntry = BaseFoodEntry & {
  foodType: 'wet';
  numberOfUnits: number;
  weightPerUnit: string;
  wetWeightUnit: 'grams' | 'oz';
  wetDailyAmountUnit: 'grams' | 'oz';
  // Dry fields are null
  bagWeight: null;
  bagWeightUnit: null;
  dryDailyAmountUnit: null;
};

// Utility types
export type FoodType = 'dry' | 'wet';
export type AnyFoodEntry = DryFoodEntry | WetFoodEntry;