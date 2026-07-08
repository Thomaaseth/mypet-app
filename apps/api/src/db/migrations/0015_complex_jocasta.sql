-- Convert existing dry food bag weights from kg to canonical grams.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM food_entries
    WHERE food_type = 'dry' AND bag_weight_unit NOT IN ('kg', 'pounds')
  ) THEN
    RAISE EXCEPTION 'Found dry food entries with bag_weight_unit other than kg — review before proceeding';
  END IF;
END $$;--> statement-breakpoint

UPDATE food_entries
SET bag_weight = bag_weight * 1000
WHERE food_type = 'dry' AND bag_weight_unit = 'kg';--> statement-breakpoint

UPDATE food_entries
SET bag_weight = bag_weight * 453.592
WHERE food_type = 'dry' AND bag_weight_unit = 'pounds';--> statement-breakpoint

ALTER TABLE "food_entries" DROP CONSTRAINT "dry_food_check";--> statement-breakpoint
ALTER TABLE "food_entries" DROP CONSTRAINT "wet_food_check";--> statement-breakpoint
ALTER TABLE "food_entries" DROP COLUMN "bag_weight_unit";--> statement-breakpoint
ALTER TABLE "food_entries" DROP COLUMN "dry_daily_amount_unit";--> statement-breakpoint
ALTER TABLE "food_entries" DROP COLUMN "wet_weight_unit";--> statement-breakpoint
ALTER TABLE "food_entries" DROP COLUMN "wet_daily_amount_unit";--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "dry_food_check" CHECK (
  (food_type != 'dry' OR (
   bag_weight IS NOT NULL AND 
   number_of_units IS NULL AND 
     weight_per_unit IS NULL))
);--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "wet_food_check" CHECK (
  (food_type != 'wet' OR (
   number_of_units IS NOT NULL AND 
   weight_per_unit IS NOT NULL AND 
     bag_weight IS NULL))
);--> statement-breakpoint
DROP TYPE "public"."dry_food_bag_unit";--> statement-breakpoint
DROP TYPE "public"."dry_food_daily_unit";--> statement-breakpoint
DROP TYPE "public"."wet_food_unit";