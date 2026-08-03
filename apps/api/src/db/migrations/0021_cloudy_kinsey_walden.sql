ALTER TABLE "appointments" DROP CONSTRAINT "appointments_veterinarian_id_veterinarians_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_veterinarian_id_veterinarians_id_fk" FOREIGN KEY ("veterinarian_id") REFERENCES "public"."veterinarians"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pets_user_id_idx" ON "pets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weight_entries_pet_id_date_unique" ON "weight_entries" USING btree ("pet_id","date");--> statement-breakpoint
CREATE INDEX "food_entries_pet_id_idx" ON "food_entries" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "veterinarians_user_id_idx" ON "veterinarians" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pet_veterinarians_pet_id_veterinarian_id_unique" ON "pet_veterinarians" USING btree ("pet_id","veterinarian_id");--> statement-breakpoint
CREATE INDEX "pet_veterinarians_veterinarian_id_idx" ON "pet_veterinarians" USING btree ("veterinarian_id");--> statement-breakpoint
CREATE INDEX "appointments_user_id_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_pet_id_idx" ON "appointments" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "pet_notes_pet_id_idx" ON "pet_notes" USING btree ("pet_id");