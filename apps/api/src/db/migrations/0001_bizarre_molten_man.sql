ALTER TABLE "food_entries" ADD COLUMN "remaining_days" integer;--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "remaining_weight" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "depletion_date" date;