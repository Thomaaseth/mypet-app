ALTER TABLE "user_preferences" RENAME COLUMN "locale" TO "date_time_locale";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "unit_system" text DEFAULT 'metric' NOT NULL;