-- Add weight_unit column (nullable first for backfill)
ALTER TABLE "weight_entries" ADD COLUMN "weight_unit" "weight_unit";

-- Backfill weight_unit from pets table
UPDATE "weight_entries" we
SET "weight_unit" = p.weight_unit
FROM "pets" p
WHERE we.pet_id = p.id;

-- Set default 'kg' for any NULL values (safety)
UPDATE "weight_entries"
SET "weight_unit" = 'kg'
WHERE "weight_unit" IS NULL;

-- Now make it required
ALTER TABLE "weight_entries" ALTER COLUMN "weight_unit" SET NOT NULL;

-- Drop weight columns from pets
ALTER TABLE "pets" DROP COLUMN "weight";--> statement-breakpoint
ALTER TABLE "pets" DROP COLUMN "weight_unit";