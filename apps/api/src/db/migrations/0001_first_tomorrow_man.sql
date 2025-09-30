ALTER TABLE "food_entries" RENAME COLUMN "date_purchased" TO "date_started";--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "date_finished" date;