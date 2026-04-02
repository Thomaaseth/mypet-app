CREATE TABLE "pet_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"pet_id" uuid NOT NULL,
	"content" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "veterinarians" ALTER COLUMN "clinic_name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "pet_notes" ADD CONSTRAINT "pet_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_notes" ADD CONSTRAINT "pet_notes_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;