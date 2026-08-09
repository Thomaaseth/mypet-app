ALTER TABLE "user_preferences" ADD COLUMN "date_format" text DEFAULT 'DMY' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "time_format" text DEFAULT '24h' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "language" text;--> statement-breakpoint
UPDATE "user_preferences"
SET "date_format" = CASE "date_time_locale" WHEN 'fr-FR' THEN 'DMY' ELSE 'MDY' END,
    "time_format" = CASE "date_time_locale" WHEN 'fr-FR' THEN '24h' ELSE '12h' END;
--> statement-breakpoint
ALTER TABLE "user_preferences" DROP COLUMN "date_time_locale";