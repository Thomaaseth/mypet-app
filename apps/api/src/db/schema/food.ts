import { 
  pgTable, 
  pgEnum, 
  text, 
  varchar, 
  decimal,
  integer,
  boolean, 
  date, 
  timestamp, 
  uuid
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pets } from './pets';

// Enums for food tracking
export const foodTypeEnum = pgEnum('food_type', ['dry', 'wet']);
export const foodUnitEnum = pgEnum('food_unit', ['kg', 'pounds', 'grams', 'cups', 'oz']);

export const foodEntries = pgTable('food_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }).notNull(),
  foodType: foodTypeEnum('food_type').notNull(), // dry, wet
  brandName: varchar('brand_name', { length: 100 }), // Optional
  productName: varchar('product_name', { length: 150 }), // Optional
  bagWeight: decimal('bag_weight', { precision: 8, scale: 2 }).notNull(), // Total weight purchased
  bagWeightUnit: foodUnitEnum('bag_weight_unit').notNull(), // Unit for bag weight
  dailyAmount: decimal('daily_amount', { precision: 8, scale: 2 }).notNull(), // Amount consumed per day
  dailyAmountUnit: foodUnitEnum('daily_amount_unit').notNull(), // Unit for daily amount
  // Wet food specific fields
  numberOfUnits: integer('number_of_units'), // e.g., 12 cans
  weightPerUnit: decimal('weight_per_unit', { precision: 8, scale: 2 }), // e.g., 85g per can
  weightPerUnitUnit: foodUnitEnum('weight_per_unit_unit'), // Unit for weight per unit
  datePurchased: date('date_purchased').notNull(), // When the food was bought
  isActive: boolean('is_active').default(true).notNull(), // For soft deletes and "finished" bags
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const foodEntriesRelations = relations(foodEntries, ({ one }) => ({
  pet: one(pets, {
    fields: [foodEntries.petId],
    references: [pets.id],
  }),
}));

// Types for TypeScript
export type FoodEntry = typeof foodEntries.$inferSelect;
export type NewFoodEntry = typeof foodEntries.$inferInsert;
export type FoodType = typeof foodTypeEnum.enumValues[number];
export type FoodUnit = typeof foodUnitEnum.enumValues[number];

// Form data type for API
export type FoodEntryFormData = Omit<NewFoodEntry, 'id' | 'petId' | 'createdAt' | 'updatedAt' | 'isActive'>;