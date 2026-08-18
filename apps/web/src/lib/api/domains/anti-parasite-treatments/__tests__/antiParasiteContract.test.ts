import { describe, it, expect } from 'vitest';
// Shared source of truth — the exact schemas the form resolver and the server use.
import {
  antiParasiteTreatmentFormSchema,
  updateAntiParasiteTreatmentSchema,
} from '@/shared/validations/anti-parasite-treatment';
import type { AntiParasiteTreatmentFormData } from '@/shared/validations/anti-parasite-treatment';

// A typical create submission as the form would produce it.
const typicalCreate: AntiParasiteTreatmentFormData = {
  productName: 'Bravecto',
  categories: ['fleas_ticks', 'worms'],
  durationUnit: 'months',
  durationAmount: 3,
  dateAdministered: '2026-07-22',
};

describe('anti-parasite form ↔ server contract', () => {
  it('a valid create submission passes the create form schema', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse(typicalCreate).success).toBe(true);
  });

  it('the same submission (full resubmit) satisfies the update schema on edit', () => {
    // Per the "full edit" decision, the edit form resubmits the complete
    // record — it must satisfy the update schema too.
    expect(updateAntiParasiteTreatmentSchema.safeParse(typicalCreate).success).toBe(true);
  });

  it('categories stays required on create (at least one)', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse({ ...typicalCreate, categories: [] }).success).toBe(false);
  });

  it('the create schema rejects a leaked server-computed field (expiryDate)', () => {
    // expiryDate is derived server-side and must never be accepted on write.
    const leaked = { ...typicalCreate, expiryDate: '2026-10-22' };
    expect(antiParasiteTreatmentFormSchema.safeParse(leaked).success).toBe(false);
  });

  it('the update schema also rejects a leaked expiryDate', () => {
    const leaked = { productName: 'Nexgard', expiryDate: '2026-10-22' };
    expect(updateAntiParasiteTreatmentSchema.safeParse(leaked).success).toBe(false);
  });

  it('a duration unit/amount that the dropdown can never produce is rejected', () => {
    // Guards the contract: if the form's <Select> and the schema drift, this fails.
    expect(
      antiParasiteTreatmentFormSchema.safeParse({ ...typicalCreate, durationUnit: 'months', durationAmount: 2 }).success,
    ).toBe(false);
  });
});