import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import * as schema from '../../../db';
import { BadRequestError, NotFoundError } from '../../../middleware/errors';
import { AntiParasiteTreatmentsService } from '../../anti-parasite-treatments.service';
import { setupUserAndPet } from './helpers/setup';
import { makeTreatmentData } from './helpers/factories';
import type { UpdateAntiParasiteTreatmentData } from '@/shared/validations/anti-parasite-treatment';

describe('AntiParasiteTreatmentsService', () => {
  describe('createTreatment', () => {
    it('creates a treatment with its category rows and computed month expiry', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const result = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ durationUnit: 'months', durationAmount: 3, dateAdministered: '2024-01-31' }),
      );
      expect(result.productName).toBe('Bravecto');
      expect(result.categories).toEqual(['fleas_ticks']);
      // Jan 31 + 3 calendar months → Apr 30 (clamped)
      expect(result.expiryDate).toBe('2024-04-30');

      // Category rows actually persisted
      const catRows = await db
        .select()
        .from(schema.antiParasiteTreatmentCategories)
        .where(eq(schema.antiParasiteTreatmentCategories.treatmentId, result.id));
      expect(catRows).toHaveLength(1);
    });

    it('computes exact-day expiry for a weeks duration', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const result = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ durationUnit: 'weeks', durationAmount: 4, dateAdministered: '2024-01-15' }),
      );

      // 4 weeks × 7 = 28 days after Jan 15 → Feb 12
      expect(result.expiryDate).toBe('2024-02-12');
    });

    it('persists all categories for a multi-category treatment', async () => {
      const { primary, testPet } = await setupUserAndPet();

      const result = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ categories: ['fleas_ticks', 'worms', 'heartworm'] }),
      );

      expect(result.categories.sort()).toEqual(['fleas_ticks', 'heartworm', 'worms']);
    });

    it('rejects a future administration date', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await expect(
        AntiParasiteTreatmentsService.createTreatment(
          testPet.id,
          primary.id,
          makeTreatmentData({ dateAdministered: '2099-01-01' }),
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws NotFoundError when the pet belongs to another user', async () => {
      const { secondary, testPet } = await setupUserAndPet();

      await expect(
        AntiParasiteTreatmentsService.createTreatment(testPet.id, secondary.id, makeTreatmentData()),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTreatments', () => {
    it('returns treatments newest-first, each enriched with categories + expiry', async () => {
      const { primary, testPet } = await setupUserAndPet();

      await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ dateAdministered: '2024-01-10' }),
      );
      await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ dateAdministered: '2024-03-10' }),
      );

      const list = await AntiParasiteTreatmentsService.getTreatments(testPet.id, primary.id);

      expect(list).toHaveLength(2);
      // newest administration first
      expect(list[0].dateAdministered).toBe('2024-03-10');
      expect(list[1].dateAdministered).toBe('2024-01-10');
      expect(list[0].categories).toEqual(['fleas_ticks']);
      expect(list[0].expiryDate).toBeDefined();
    });

    it('returns an empty array when the pet has no treatments', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const list = await AntiParasiteTreatmentsService.getTreatments(testPet.id, primary.id);
      expect(list).toEqual([]);
    });

    it('throws NotFoundError when the pet belongs to another user', async () => {
      const { secondary, testPet } = await setupUserAndPet();
      await expect(
        AntiParasiteTreatmentsService.getTreatments(testPet.id, secondary.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTreatmentById', () => {
    it('throws BadRequestError for a malformed UUID', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await expect(
        AntiParasiteTreatmentsService.getTreatmentById(testPet.id, 'not-a-uuid', primary.id),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws NotFoundError for a well-formed but missing ID', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await expect(
        AntiParasiteTreatmentsService.getTreatmentById(testPet.id, randomUUID(), primary.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTreatment', () => {
    it('patches a scalar field and leaves categories intact', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ productName: 'Bravecto', categories: ['worms'] }),
      );

      const updated = await AntiParasiteTreatmentsService.updateTreatment(
        testPet.id,
        created.id,
        primary.id,
        { productName: 'Nexgard' },
      );

      expect(updated.productName).toBe('Nexgard');
      expect(updated.categories).toEqual(['worms']);
    });

    it('replaces the full category set when categories are supplied', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ categories: ['fleas_ticks', 'worms'] }),
      );

      const updated = await AntiParasiteTreatmentsService.updateTreatment(
        testPet.id,
        created.id,
        primary.id,
        { categories: ['heartworm'] },
      );

      // Old categories gone, only the new set remains
      expect(updated.categories).toEqual(['heartworm']);

      const catRows = await db
        .select()
        .from(schema.antiParasiteTreatmentCategories)
        .where(eq(schema.antiParasiteTreatmentCategories.treatmentId, created.id));
      expect(catRows).toHaveLength(1);
      expect(catRows[0].category).toBe('heartworm');
    });

    it('recomputes expiry when the duration changes', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ durationUnit: 'months', durationAmount: 3, dateAdministered: '2024-01-15' }),
      );

      const updated = await AntiParasiteTreatmentsService.updateTreatment(
        testPet.id,
        created.id,
        primary.id,
        { durationUnit: 'weeks', durationAmount: 4 },
      );

      // now 4 weeks from Jan 15 → Feb 12
      expect(updated.expiryDate).toBe('2024-02-12');
    });

    it('rejects an empty update payload', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData(),
      );

      await expect(
        AntiParasiteTreatmentsService.updateTreatment(
          testPet.id,
          created.id,
          primary.id,
          {} as UpdateAntiParasiteTreatmentData,
        ),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteTreatment', () => {
    it('deletes the treatment and cascades its category rows', async () => {
      const { primary, testPet } = await setupUserAndPet();
      const created = await AntiParasiteTreatmentsService.createTreatment(
        testPet.id,
        primary.id,
        makeTreatmentData({ categories: ['fleas_ticks', 'worms'] }),
      );

      await AntiParasiteTreatmentsService.deleteTreatment(testPet.id, created.id, primary.id);

      const list = await AntiParasiteTreatmentsService.getTreatments(testPet.id, primary.id);
      expect(list).toEqual([]);

      const catRows = await db
        .select()
        .from(schema.antiParasiteTreatmentCategories)
        .where(eq(schema.antiParasiteTreatmentCategories.treatmentId, created.id));
      expect(catRows).toHaveLength(0);
    });

    it('throws NotFoundError for a missing treatment', async () => {
      const { primary, testPet } = await setupUserAndPet();
      await expect(
        AntiParasiteTreatmentsService.deleteTreatment(testPet.id, randomUUID(), primary.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('isActive computation', () => {
  // Helpers build dates relative to the real "today" so the tests never rot.
  const daysFromToday = (n: number): string => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  it('marks a treatment whose expiry is in the future as active', async () => {
    const { primary, testPet } = await setupUserAndPet();

    // Administered recently, 3-month duration → expiry well in the future.
    const result = await AntiParasiteTreatmentsService.createTreatment(
      testPet.id,
      primary.id,
      makeTreatmentData({
        durationUnit: 'months',
        durationAmount: 3,
        dateAdministered: daysFromToday(-1), // yesterday
      }),
    );

    expect(result.isActive).toBe(true);
    // expiry is ~3 months out, definitely >= today
    expect(result.expiryDate >= daysFromToday(0)).toBe(true);
  });

  it('marks a treatment whose expiry has passed as inactive', async () => {
    const { primary, testPet } = await setupUserAndPet();

    // Administered ~10 weeks ago with a 4-week duration → long expired.
    const result = await AntiParasiteTreatmentsService.createTreatment(
      testPet.id,
      primary.id,
      makeTreatmentData({
        durationUnit: 'weeks',
        durationAmount: 4,
        dateAdministered: daysFromToday(-70),
      }),
    );

    expect(result.isActive).toBe(false);
    expect(result.expiryDate < daysFromToday(0)).toBe(true);
  });

  it('treats the expiry day itself as still active (>= today, boundary)', async () => {
    const { primary, testPet } = await setupUserAndPet();

    // 4 weeks (28 days) before today → expiry === today exactly.
    const result = await AntiParasiteTreatmentsService.createTreatment(
      testPet.id,
      primary.id,
      makeTreatmentData({
        durationUnit: 'weeks',
        durationAmount: 4,
        dateAdministered: daysFromToday(-28),
      }),
    );

    // expiry should equal today; boundary is inclusive → active
    expect(result.expiryDate).toBe(daysFromToday(0));
    expect(result.isActive).toBe(true);
  });

  it('recomputes isActive on read (getTreatments), not just on create', async () => {
    const { primary, testPet } = await setupUserAndPet();

    await AntiParasiteTreatmentsService.createTreatment(
      testPet.id,
      primary.id,
      makeTreatmentData({ durationUnit: 'weeks', durationAmount: 4, dateAdministered: daysFromToday(-70) }),
    );

    const list = await AntiParasiteTreatmentsService.getTreatments(testPet.id, primary.id);
    expect(list[0].isActive).toBe(false);
  });
});
});
