CREATE TYPE "public"."pet_animal_type" AS ENUM('cat', 'dog');--> statement-breakpoint
CREATE TYPE "public"."pet_gender" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."weight_unit" AS ENUM('kg', 'lbs');--> statement-breakpoint
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
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;