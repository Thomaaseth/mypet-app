ALTER TABLE "food_entries" DROP CONSTRAINT "dry_food_check";--> statement-breakpoint
ALTER TABLE "food_entries" DROP CONSTRAINT "wet_food_check";--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "dry_food_check" CHECK (
  (food_type != 'dry' OR (
   bag_weight IS NOT NULL AND 
   bag_weight_unit IS NOT NULL AND 
   dry_daily_amount_unit IS NOT NULL AND
   number_of_units IS NULL AND 
   weight_per_unit IS NULL AND 
   wet_weight_unit IS NULL AND
   wet_daily_amount_unit IS NULL))
);--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "wet_food_check" CHECK (
  (food_type != 'wet' OR (
   number_of_units IS NOT NULL AND 
   weight_per_unit IS NOT NULL AND 
   wet_weight_unit IS NOT NULL AND
   wet_daily_amount_unit IS NOT NULL AND
   bag_weight IS NULL AND 
   bag_weight_unit IS NULL AND
   dry_daily_amount_unit IS NULL))
);