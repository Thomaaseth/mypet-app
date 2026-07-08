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


export const foodEntries = pgTable('food_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  foodType: foodTypeEnum('food_type').notNull(),
  
  // Common fields
  brandName: varchar('brand_name', { length: 100 }),
  productName: varchar('product_name', { length: 150 }),
  // Canonical grams for both dry and wet daily amount
  dailyAmount: decimal('daily_amount', { precision: 8, scale: 2 }).notNull(),
  dateStarted: date('date_started').notNull(),
  
  // DRY FOOD ONLY
  bagWeight: decimal('bag_weight', { precision: 8, scale: 2 }),
  
  // WET FOOD ONLY
  numberOfUnits: integer('number_of_units'),
  weightPerUnit: decimal('weight_per_unit', { precision: 8, scale: 2 }),
  
  // STATUS FIELDS
  isActive: boolean('is_active').default(true).notNull(),
  dateFinished: date('date_finished'), 

  // TIMESTAMPS
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Database constraints
dryFoodConstraint: check('dry_food_check', sql`
  (food_type != 'dry' OR (
   bag_weight IS NOT NULL AND 
   number_of_units IS NULL AND 
     weight_per_unit IS NULL))
`),

wetFoodConstraint: check('wet_food_check', sql`
  (food_type != 'wet' OR (
   number_of_units IS NOT NULL AND 
   weight_per_unit IS NOT NULL AND 
     bag_weight IS NULL))
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
  // Wet fields are null
  numberOfUnits: null;
  weightPerUnit: null;

  // Calculated fields for active entries
  remainingDays?: number;
  remainingWeight?: number;
  depletionDate?: string;

  // Calculated fields for finished entries
  actualDaysElapsed?: number;
  actualDailyConsumption?: number;
  expectedDailyConsumption?: number;
  variancePercentage?: number;
  feedingStatus?: 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';
};

export type WetFoodEntry = BaseFoodEntry & {
  foodType: 'wet';
  numberOfUnits: number;
  weightPerUnit: string;
  // Dry fields are null
  bagWeight: null;

  // Calculated fields for active entries
  remainingDays?: number;
  remainingWeight?: number;
  depletionDate?: string;
  
  // Calculated fields for finished entries
  actualDaysElapsed?: number;
  actualDailyConsumption?: number;
  expectedDailyConsumption?: number;
  variancePercentage?: number;
  feedingStatus?: 'overfeeding' | 'slightly-over' | 'normal' | 'slightly-under' | 'underfeeding';
};

// Utility types
export type FoodType = 'dry' | 'wet';
export type AnyFoodEntry = DryFoodEntry | WetFoodEntry;