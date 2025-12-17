CREATE TYPE "public"."appointment_type" AS ENUM('checkup', 'vaccination', 'surgery', 'dental', 'grooming', 'emergency', 'other');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"pet_id" uuid NOT NULL,
	"veterinarian_id" uuid NOT NULL,
	"appointment_date" date NOT NULL,
	"appointment_time" time NOT NULL,
	"appointment_type" "appointment_type" NOT NULL,
	"reason_for_visit" text,
	"visit_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_veterinarian_id_veterinarians_id_fk" FOREIGN KEY ("veterinarian_id") REFERENCES "public"."veterinarians"("id") ON DELETE cascade ON UPDATE no action;