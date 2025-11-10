CREATE TABLE "weight_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"min_weight" numeric(6, 2) NOT NULL,
	"max_weight" numeric(6, 2) NOT NULL,
	"weight_unit" "weight_unit" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weight_targets_pet_id_unique" UNIQUE("pet_id")
);
--> statement-breakpoint
ALTER TABLE "weight_targets" ADD CONSTRAINT "weight_targets_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;