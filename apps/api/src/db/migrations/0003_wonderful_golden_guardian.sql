ALTER TABLE "food_entries" ALTER COLUMN "bag_weight_unit" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "daily_amount_unit" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "weight_per_unit_unit" text;--> statement-breakpoint
DROP TYPE "public"."food_unit";--> statement-breakpoint
CREATE TYPE "public"."food_unit" AS ENUM('kg', 'pounds', 'grams', 'cups', 'oz');--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "bag_weight_unit" SET DATA TYPE "public"."food_unit" USING "bag_weight_unit"::"public"."food_unit";--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "daily_amount_unit" SET DATA TYPE "public"."food_unit" USING "daily_amount_unit"::"public"."food_unit";--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "weight_per_unit_unit" SET DATA TYPE "public"."food_unit" USING "weight_per_unit_unit"::"public"."food_unit";--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "number_of_units" integer;--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "weight_per_unit" numeric(8, 2);--> statement-breakpoint
