import { db } from '../db';
import {
  antiParasiteTreatments,
  antiParasiteTreatmentCategories,
} from '../db/schema/anti-parasite-treatment';
import { eq, and, desc } from 'drizzle-orm';
import type {
  AntiParasiteTreatment,
} from '../db/schema/anti-parasite-treatment';
import { BadRequestError, NotFoundError } from '../middleware/errors';
import { PetsService } from './pets.service';
import { UserPreferencesService } from './user-preferences.service';
import { dbLogger } from '../lib/logger';
import { validateUUID } from '@/lib/validateUUID';
import { addCalendarDays, addCalendarMonths } from '@/shared/utils/dates';
import type {
  AntiParasiteCategory,
  AntiParasiteTreatmentFormData,
  UpdateAntiParasiteTreatmentData,
} from '@/shared/validations/anti-parasite-treatment';

// The service return shape: the stored row, plus derived fields computed on
// read and never persisted — categories flattened out of the join table, and
// expiryDate ("protected until") computed from dateAdministered + duration.
// Mirrors FoodService returning entries enriched with remainingDays/depletionDate.
export interface EnrichedAntiParasiteTreatment {
  id: string;
  petId: string;
  productName: string;
  durationUnit: AntiParasiteTreatment['durationUnit'];
  durationAmount: number;
  dateAdministered: string;
  categories: AntiParasiteCategory[];
  expiryDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AntiParasiteTreatmentsService {
  private static async verifyPetOwnership(petId: string, userId: string): Promise<void> {
    try {
      await PetsService.getPetById(petId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('Pet not found or access denied');
      }
      throw error;
    }
  }

  private static validateInputs(
    data: Partial<AntiParasiteTreatmentFormData>,
    today: string,
    isUpdate = false,
  ): void {
    if (!isUpdate) {
      if (!data.productName || !data.dateAdministered || !data.categories || !data.durationUnit) {
        throw new BadRequestError('Product name, categories, duration, and date are required');
      }
    }

    if (data.dateAdministered !== undefined) {
      if (isNaN(new Date(data.dateAdministered).getTime())) {
        throw new BadRequestError('Invalid date format');
      }
      if (data.dateAdministered > today) {
        throw new BadRequestError('Date cannot be in the future');
      }
    }

    if (data.categories !== undefined && data.categories.length === 0) {
      throw new BadRequestError('At least one category is required');
    }
  }

  // Compute "protected until" from the administration date + duration.
  // Weeks are exact-day math; months are calendar-month math with clamping
  private static computeExpiryDate(
    dateAdministered: string,
    durationUnit: AntiParasiteTreatment['durationUnit'],
    durationAmount: number,
  ): string {
    if (durationUnit === 'weeks') {
      return addCalendarDays(dateAdministered, durationAmount * 7);
    }
    return addCalendarMonths(dateAdministered, durationAmount);
  }

  // Merge a stored row + its category rows into the enriched read shape.
  private static enrich(
    treatment: AntiParasiteTreatment,
    categories: AntiParasiteCategory[],
    today: string,
  ): EnrichedAntiParasiteTreatment {
    const expiryDate = this.computeExpiryDate(
      treatment.dateAdministered,
      treatment.durationUnit,
      treatment.durationAmount,
    );
    return {
      id: treatment.id,
      petId: treatment.petId,
      productName: treatment.productName,
      durationUnit: treatment.durationUnit,
      durationAmount: treatment.durationAmount,
      dateAdministered: treatment.dateAdministered,
      categories,
      expiryDate,
      // Active = protection still valid through the expiry date, compared
      // against the user's tz-aware "today" (single definition of today,
      // no client-side clock — avoids day-boundary drift).
      isActive: expiryDate >= today,
      createdAt: treatment.createdAt,
      updatedAt: treatment.updatedAt,
    };
  }

  // Get all treatments for a pet, newest first, each enriched with its
  // categories + computed expiry.
  static async getTreatments(
    petId: string,
    userId: string,
  ): Promise<EnrichedAntiParasiteTreatment[]> {
    try {
      await this.verifyPetOwnership(petId, userId);
      const today = await UserPreferencesService.getTodayForUser(userId);

      const rows = await db.query.antiParasiteTreatments.findMany({
        where: eq(antiParasiteTreatments.petId, petId),
        orderBy: [desc(antiParasiteTreatments.dateAdministered), desc(antiParasiteTreatments.createdAt)],
        with: {
          categories: true,
        },
      });

      return rows.map((row) =>
        this.enrich(
          row,
          row.categories.map((c) => c.category),
          today,
        ),
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching anti-parasite treatments');
      throw new BadRequestError('Failed to fetch anti-parasite treatments');
    }
  }

  static async getTreatmentById(
    petId: string,
    treatmentId: string,
    userId: string,
  ): Promise<EnrichedAntiParasiteTreatment> {
    try {
      validateUUID(treatmentId, 'treatment ID');
      await this.verifyPetOwnership(petId, userId);
      const today = await UserPreferencesService.getTodayForUser(userId);

      const row = await db.query.antiParasiteTreatments.findFirst({
        where: and(
          eq(antiParasiteTreatments.id, treatmentId),
          eq(antiParasiteTreatments.petId, petId),
        ),
        with: {
          categories: true,
        },
      });

      if (!row) {
        throw new NotFoundError('Anti-parasite treatment not found');
      }

      return this.enrich(
        row,
        row.categories.map((c) => c.category),
        today,
      );
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error fetching anti-parasite treatment by ID');
      throw new BadRequestError('Failed to fetch anti-parasite treatment');
    }
  }

  // Create one treatment + its category rows atomically. Parent is
  // meaningless without its children, so both writes share a transaction.
  static async createTreatment(
    petId: string,
    userId: string,
    data: AntiParasiteTreatmentFormData,
  ): Promise<EnrichedAntiParasiteTreatment> {
    try {
      await this.verifyPetOwnership(petId, userId);
      const today = await UserPreferencesService.getTodayForUser(userId);

      this.validateInputs(data, today, false);

      const createdId = await db.transaction(async (tx) => {
        const [newTreatment] = await tx
          .insert(antiParasiteTreatments)
          .values({
            petId,
            productName: data.productName,
            durationUnit: data.durationUnit,
            durationAmount: data.durationAmount,
            dateAdministered: data.dateAdministered,
          })
          .returning();

        await tx.insert(antiParasiteTreatmentCategories).values(
          data.categories.map((category) => ({
            treatmentId: newTreatment.id,
            category,
          })),
        );

        return newTreatment.id;
      });

      // Re-read through the enriching getter so create/read shapes are identical.
      return await this.getTreatmentById(petId, createdId, userId);
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error creating anti-parasite treatment');
      throw new BadRequestError('Failed to create anti-parasite treatment');
    }
  }

  // Update a treatment. Scalar fields patch normally; `categories`, if present,
  // REPLACES the full set (delete-all + re-insert), not an add/remove diff
  // writes share one transaction.
  static async updateTreatment(
    petId: string,
    treatmentId: string,
    userId: string,
    updateData: UpdateAntiParasiteTreatmentData,
  ): Promise<EnrichedAntiParasiteTreatment> {
    try {
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('At least one field must be provided for update');
      }

      await this.getTreatmentById(petId, treatmentId, userId);
      const today = await UserPreferencesService.getTodayForUser(userId);

      this.validateInputs(updateData, today, true);

      const dbUpdate: Partial<{
        productName: string;
        durationUnit: AntiParasiteTreatment['durationUnit'];
        durationAmount: number;
        dateAdministered: string;
      }> = {};

      if (updateData.productName !== undefined) dbUpdate.productName = updateData.productName;
      if (updateData.dateAdministered !== undefined) dbUpdate.dateAdministered = updateData.dateAdministered;
      // durationUnit + durationAmount travel together
      if (updateData.durationUnit !== undefined && updateData.durationAmount !== undefined) {
        dbUpdate.durationUnit = updateData.durationUnit;
        dbUpdate.durationAmount = updateData.durationAmount;
      }

      await db.transaction(async (tx) => {
        if (Object.keys(dbUpdate).length > 0) {
          await tx
            .update(antiParasiteTreatments)
            .set({ ...dbUpdate, updatedAt: new Date() })
            .where(and(
              eq(antiParasiteTreatments.id, treatmentId),
              eq(antiParasiteTreatments.petId, petId),
            ));
        }

        // Full category-set replacement, only when categories are supplied.
        if (updateData.categories !== undefined) {
          await tx
            .delete(antiParasiteTreatmentCategories)
            .where(eq(antiParasiteTreatmentCategories.treatmentId, treatmentId));

          await tx.insert(antiParasiteTreatmentCategories).values(
            updateData.categories.map((category) => ({
              treatmentId,
              category,
            })),
          );
        }
      });

      return await this.getTreatmentById(petId, treatmentId, userId);
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error updating anti-parasite treatment');
      throw new BadRequestError('Failed to update anti-parasite treatment');
    }
  }

  static async deleteTreatment(petId: string, treatmentId: string, userId: string): Promise<void> {
    try {
      await this.getTreatmentById(petId, treatmentId, userId);

      const deletedRows = await db
        .delete(antiParasiteTreatments)
        .where(and(
          eq(antiParasiteTreatments.id, treatmentId),
          eq(antiParasiteTreatments.petId, petId),
        ))
        .returning();

      if (deletedRows.length === 0) {
        throw new NotFoundError('Anti-parasite treatment not found');
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      dbLogger.error({ err: error }, 'Error deleting anti-parasite treatment');
      throw new BadRequestError('Failed to delete anti-parasite treatment');
    }
  }
}