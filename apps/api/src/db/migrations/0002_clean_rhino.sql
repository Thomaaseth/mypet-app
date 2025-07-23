CREATE TYPE "public"."food_type" AS ENUM('dry', 'wet');--> statement-breakpoint
CREATE TYPE "public"."food_unit" AS ENUM('grams', 'pounds', 'cups');--> statement-breakpoint
CREATE TABLE "food_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"food_type" "food_type" NOT NULL,
	"brand_name" varchar(100),
	"product_name" varchar(150),
	"bag_weight" numeric(8, 2) NOT NULL,
	"bag_weight_unit" "food_unit" NOT NULL,
	"daily_amount" numeric(8, 2) NOT NULL,
	"daily_amount_unit" "food_unit" NOT NULL,
	"date_purchased" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;