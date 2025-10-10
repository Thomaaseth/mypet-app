ALTER TABLE "food_entries" ALTER COLUMN "dry_daily_amount_unit" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."dry_food_daily_unit";--> statement-breakpoint
CREATE TYPE "public"."dry_food_daily_unit" AS ENUM('grams');--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "dry_daily_amount_unit" SET DATA TYPE "public"."dry_food_daily_unit" USING "dry_daily_amount_unit"::"public"."dry_food_daily_unit";