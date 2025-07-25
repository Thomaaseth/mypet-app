CREATE TYPE "public"."dry_food_bag_unit" AS ENUM('kg', 'pounds');--> statement-breakpoint
CREATE TYPE "public"."dry_food_daily_unit" AS ENUM('grams', 'cups');--> statement-breakpoint
CREATE TYPE "public"."wet_food_unit" AS ENUM('grams', 'oz');--> statement-breakpoint
CREATE TABLE "food_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pet_id" uuid NOT NULL,
  "food_type" "food_type" NOT NULL,
  "brand_name" varchar(100),
  "product_name" varchar(150),
  "daily_amount" numeric(8,2) NOT NULL,
  "date_purchased" date NOT NULL,
  "bag_weight" numeric(8,2),
  "bag_weight_unit" "dry_food_bag_unit",
  "dry_daily_amount_unit" "dry_food_daily_unit",
  "number_of_units" integer,
  "weight_per_unit" numeric(8,2),
  "wet_weight_unit" "wet_food_unit",
  "wet_daily_amount_unit" "wet_food_unit",
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "dry_food_check" CHECK (
    (food_type = 'dry' AND 
     bag_weight IS NOT NULL AND 
     bag_weight_unit IS NOT NULL AND 
     dry_daily_amount_unit IS NOT NULL AND
     number_of_units IS NULL AND 
     weight_per_unit IS NULL AND 
     wet_weight_unit IS NULL AND
     wet_daily_amount_unit IS NULL)
  );--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "wet_food_check" CHECK (
    (food_type = 'wet' AND 
     number_of_units IS NOT NULL AND 
     weight_per_unit IS NOT NULL AND 
     wet_weight_unit IS NOT NULL AND
     wet_daily_amount_unit IS NOT NULL AND
     bag_weight IS NULL AND 
     bag_weight_unit IS NULL AND
     dry_daily_amount_unit IS NULL)
  );--> statement-breakpoint
DROP TYPE IF EXISTS "public"."food_unit";