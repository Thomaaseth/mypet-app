-- Custom SQL migration file, put your code below! --
ALTER TABLE "food_entries" ADD COLUMN IF NOT EXISTS "date_finished" date;