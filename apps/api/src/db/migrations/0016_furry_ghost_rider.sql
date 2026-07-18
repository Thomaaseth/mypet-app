ALTER TABLE "pets" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "pets" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pets" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "pets" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "weight_entries" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "weight_entries" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "weight_entries" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "weight_entries" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "food_entries" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "food_entries" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "weight_targets" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "weight_targets" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "weight_targets" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "weight_targets" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "veterinarians" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "veterinarians" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "veterinarians" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "veterinarians" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "pet_veterinarians" ALTER COLUMN "assigned_at" SET DATA TYPE timestamp with time zone USING "assigned_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "pet_veterinarians" ALTER COLUMN "assigned_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "pet_notes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "pet_notes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pet_notes" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "pet_notes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint

ALTER TABLE "user_preferences" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'Europe/Paris';--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "updated_at" SET DEFAULT now();