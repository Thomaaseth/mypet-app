ALTER TABLE "pets" ALTER COLUMN "gender" DROP DEFAULT;
--> statement-breakpoint
UPDATE "pets" SET "gender" = 'male' WHERE "gender" = 'unknown' OR "gender" IS NULL;
--> statement-breakpoint
CREATE TYPE "public"."pet_gender_new" AS ENUM('male', 'female');
--> statement-breakpoint
ALTER TABLE "pets" ALTER COLUMN "gender" TYPE "public"."pet_gender_new" USING ("gender"::text::"public"."pet_gender_new");
--> statement-breakpoint
ALTER TABLE "pets" ALTER COLUMN "gender" SET NOT NULL;
--> statement-breakpoint
DROP TYPE "public"."pet_gender";
--> statement-breakpoint
ALTER TYPE "public"."pet_gender_new" RENAME TO "pet_gender";