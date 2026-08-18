CREATE TYPE "public"."anti_parasite_category" AS ENUM('fleas_ticks', 'worms', 'heartworm');--> statement-breakpoint
CREATE TYPE "public"."anti_parasite_duration_unit" AS ENUM('weeks', 'months');--> statement-breakpoint
CREATE TABLE "anti_parasite_treatment_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treatment_id" uuid NOT NULL,
	"category" "anti_parasite_category" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anti_parasite_treatments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"product_name" varchar(50) NOT NULL,
	"duration_unit" "anti_parasite_duration_unit" NOT NULL,
	"duration_amount" integer NOT NULL,
	"date_administered" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anti_parasite_treatment_categories" ADD CONSTRAINT "anti_parasite_treatment_categories_treatment_id_anti_parasite_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."anti_parasite_treatments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_parasite_treatments" ADD CONSTRAINT "anti_parasite_treatments_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anti_parasite_treatment_categories_treatment_id_category_unique" ON "anti_parasite_treatment_categories" USING btree ("treatment_id","category");--> statement-breakpoint
CREATE INDEX "anti_parasite_treatment_categories_category_idx" ON "anti_parasite_treatment_categories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "anti_parasite_treatments_pet_id_idx" ON "anti_parasite_treatments" USING btree ("pet_id");