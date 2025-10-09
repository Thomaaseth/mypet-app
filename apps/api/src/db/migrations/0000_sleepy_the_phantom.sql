CREATE TYPE "public"."pet_animal_type" AS ENUM('cat', 'dog');--> statement-breakpoint
CREATE TYPE "public"."pet_gender" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."weight_unit" AS ENUM('kg', 'lbs');--> statement-breakpoint
CREATE TYPE "public"."dry_food_bag_unit" AS ENUM('kg', 'pounds');--> statement-breakpoint
CREATE TYPE "public"."dry_food_daily_unit" AS ENUM('grams', 'cups');--> statement-breakpoint
CREATE TYPE "public"."food_type" AS ENUM('dry', 'wet');--> statement-breakpoint
CREATE TYPE "public"."wet_food_unit" AS ENUM('grams', 'oz');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"animal_type" "pet_animal_type" NOT NULL,
	"species" varchar(50),
	"gender" "pet_gender" DEFAULT 'unknown',
	"birth_date" date,
	"weight" numeric(6, 2),
	"weight_unit" "weight_unit" DEFAULT 'kg',
	"is_neutered" boolean DEFAULT false,
	"microchip_number" varchar(50),
	"image_url" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"weight" numeric(6, 2) NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"food_type" "food_type" NOT NULL,
	"brand_name" varchar(100),
	"product_name" varchar(150),
	"daily_amount" numeric(8, 2) NOT NULL,
	"date_started" date NOT NULL,
	"bag_weight" numeric(8, 2),
	"bag_weight_unit" "dry_food_bag_unit",
	"dry_daily_amount_unit" "dry_food_daily_unit",
	"number_of_units" integer,
	"weight_per_unit" numeric(8, 2),
	"wet_weight_unit" "wet_food_unit",
	"wet_daily_amount_unit" "wet_food_unit",
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dry_food_check" CHECK (
  (food_type != 'dry' OR (
   bag_weight IS NOT NULL AND 
   bag_weight_unit IS NOT NULL AND 
   dry_daily_amount_unit IS NOT NULL AND
   number_of_units IS NULL AND 
   weight_per_unit IS NULL AND 
   wet_weight_unit IS NULL AND
   wet_daily_amount_unit IS NULL))
),
	CONSTRAINT "wet_food_check" CHECK (
  (food_type != 'wet' OR (
   number_of_units IS NOT NULL AND 
   weight_per_unit IS NOT NULL AND 
   wet_weight_unit IS NOT NULL AND
   wet_daily_amount_unit IS NOT NULL AND
   bag_weight IS NULL AND 
   bag_weight_unit IS NULL AND
   dry_daily_amount_unit IS NULL))
)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;