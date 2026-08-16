import { describe, it, expect } from 'vitest';
import {
  antiParasiteTreatmentFormSchema,
  updateAntiParasiteTreatmentSchema,
  ANTI_PARASITE_DURATION_OPTIONS,
  encodeDurationOption,
  decodeDurationOption,
  antiParasiteTreatmentFormFieldsSchema,
} from '../anti-parasite-treatment';
import { expectRejectsUnknownKey } from './_helpers';

describe('antiParasiteTreatmentFormSchema', () => {
  const valid = {
    productName: 'Bravecto',
    categories: ['fleas_ticks' as const],
    durationUnit: 'months' as const,
    durationAmount: 3,
    dateAdministered: '2026-07-22',
  };

  it('accepts a well-formed entry', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts multiple categories on one entry', () => {
    const result = antiParasiteTreatmentFormSchema.safeParse({
      ...valid,
      categories: ['fleas_ticks', 'worms', 'heartworm'],
    });
    expect(result.success).toBe(true);
  });

  // --- productName ---
  it('rejects an empty product name', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse({ ...valid, productName: '' }).success).toBe(false);
  });

  it('rejects a product name over 50 chars', () => {
    expect(
      antiParasiteTreatmentFormSchema.safeParse({ ...valid, productName: 'a'.repeat(51) }).success,
    ).toBe(false);
  });

  it('trims surrounding whitespace on product name', () => {
    const result = antiParasiteTreatmentFormSchema.safeParse({ ...valid, productName: '  Bravecto  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productName).toBe('Bravecto');
    }
  });

  // --- categories ---
  it('rejects an empty categories array', () => {
    const result = antiParasiteTreatmentFormSchema.safeParse({ ...valid, categories: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['categories']);
    }
  });

  it('rejects an unknown category value', () => {
    expect(
      antiParasiteTreatmentFormSchema.safeParse({ ...valid, categories: ['lungworm'] }).success,
    ).toBe(false);
  });

  it('rejects duplicate categories', () => {
    const result = antiParasiteTreatmentFormSchema.safeParse({
      ...valid,
      categories: ['worms', 'worms'],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['categories']);
    }
  });

  // --- duration ---
  it('rejects a non-integer duration amount', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse({ ...valid, durationAmount: 3.5 }).success).toBe(false);
  });

  it('rejects a non-positive duration amount', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse({ ...valid, durationAmount: 0 }).success).toBe(false);
  });

  it('rejects an invalid duration unit', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse({ ...valid, durationUnit: 'days' }).success).toBe(false);
  });

  it('rejects a unit/amount combination not in the allowed option list', () => {
    // { months, 2 } is not one of the 15 allowed options (months start at 3)
    const result = antiParasiteTreatmentFormSchema.safeParse({
      ...valid,
      durationUnit: 'months',
      durationAmount: 2,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['durationAmount']);
    }
  });

  it('rejects weeks amount below the 4-week floor', () => {
    expect(
      antiParasiteTreatmentFormSchema.safeParse({ ...valid, durationUnit: 'weeks', durationAmount: 3 }).success,
    ).toBe(false);
  });

  it('accepts every option in ANTI_PARASITE_DURATION_OPTIONS', () => {
    for (const opt of ANTI_PARASITE_DURATION_OPTIONS) {
      const result = antiParasiteTreatmentFormSchema.safeParse({
        ...valid,
        durationUnit: opt.unit,
        durationAmount: opt.amount,
      });
      expect(result.success).toBe(true);
    }
  });

  // --- date ---
  it('rejects a missing date', () => {
    expect(antiParasiteTreatmentFormSchema.safeParse({ ...valid, dateAdministered: '' }).success).toBe(false);
  });

  it('rejects an unparseable date', () => {
    expect(
      antiParasiteTreatmentFormSchema.safeParse({ ...valid, dateAdministered: 'not-a-date' }).success,
    ).toBe(false);
  });

  // Consistent with weightEntryFormSchema: format-only, no "now" business rule
  // (future-date enforcement lives server-side via getTodayForUser).
  it('does NOT reject a future date (business rule lives server-side)', () => {
    expect(
      antiParasiteTreatmentFormSchema.safeParse({ ...valid, dateAdministered: '2099-01-01' }).success,
    ).toBe(true);
  });

  it('rejects unknown keys (strict)', () => expectRejectsUnknownKey(antiParasiteTreatmentFormSchema, valid));
});

describe('updateAntiParasiteTreatmentSchema', () => {
  it('accepts a partial update with just the product name', () => {
    expect(updateAntiParasiteTreatmentSchema.safeParse({ productName: 'Nexgard' }).success).toBe(true);
  });

  it('accepts an empty object (no-op update)', () => {
    expect(updateAntiParasiteTreatmentSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a full category-set replacement', () => {
    expect(
      updateAntiParasiteTreatmentSchema.safeParse({ categories: ['worms', 'heartworm'] }).success,
    ).toBe(true);
  });

  it('requires durationUnit when durationAmount is provided alone', () => {
    const result = updateAntiParasiteTreatmentSchema.safeParse({ durationAmount: 3 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['durationUnit']);
    }
  });

  it('requires durationAmount when durationUnit is provided alone', () => {
    const result = updateAntiParasiteTreatmentSchema.safeParse({ durationUnit: 'months' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['durationAmount']);
    }
  });

  it('accepts durationUnit + durationAmount together when the combination is valid', () => {
    expect(
      updateAntiParasiteTreatmentSchema.safeParse({ durationUnit: 'months', durationAmount: 6 }).success,
    ).toBe(true);
  });

  it('rejects a valid-pairing-but-invalid-combination duration', () => {
    const result = updateAntiParasiteTreatmentSchema.safeParse({ durationUnit: 'weeks', durationAmount: 3 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['durationAmount']);
    }
  });


  it('rejects an empty categories array on update', () => {
    expect(updateAntiParasiteTreatmentSchema.safeParse({ categories: [] }).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => expectRejectsUnknownKey(updateAntiParasiteTreatmentSchema, {}));
});

describe('encodeDurationOption / decodeDurationOption', () => {
  it('encodes a pair as "unit:amount"', () => {
    expect(encodeDurationOption({ unit: 'weeks', amount: 4 })).toBe('weeks:4');
    expect(encodeDurationOption({ unit: 'months', amount: 12 })).toBe('months:12');
  });

  it('round-trips every allowed option (encode → decode → same pair)', () => {
    for (const opt of ANTI_PARASITE_DURATION_OPTIONS) {
      const decoded = decodeDurationOption(encodeDurationOption(opt));
      expect(decoded).toEqual({ durationUnit: opt.unit, durationAmount: opt.amount });
    }
  });

  it('decodes a known option string into the two API fields', () => {
    expect(decodeDurationOption('months:3')).toEqual({ durationUnit: 'months', durationAmount: 3 });
  });

  it('returns null for the empty (nothing-selected) string', () => {
    expect(decodeDurationOption('')).toBeNull();
  });

  it('returns null for a well-formed but disallowed combination', () => {
    // months:2 is not one of the 15 allowed options (months start at 3)
    expect(decodeDurationOption('months:2')).toBeNull();
    // weeks:3 is below the 4-week floor
    expect(decodeDurationOption('weeks:3')).toBeNull();
  });

  it('returns null for a malformed string', () => {
    expect(decodeDurationOption('garbage')).toBeNull();
    expect(decodeDurationOption('weeks')).toBeNull();
    expect(decodeDurationOption('4:weeks')).toBeNull();
  });
});

describe('antiParasiteTreatmentFormFieldsSchema', () => {
  const validFields = {
    productName: 'Bravecto',
    categories: ['fleas_ticks' as const],
    duration: 'months:3',
    dateAdministered: '2026-07-22',
  };

  it('accepts a well-formed form payload', () => {
    expect(antiParasiteTreatmentFormFieldsSchema.safeParse(validFields).success).toBe(true);
  });

  it('rejects an empty duration (nothing selected)', () => {
    const result = antiParasiteTreatmentFormFieldsSchema.safeParse({ ...validFields, duration: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['duration']);
    }
  });

  it('rejects a duration string that decodes to no known option', () => {
    expect(antiParasiteTreatmentFormFieldsSchema.safeParse({ ...validFields, duration: 'months:2' }).success).toBe(false);
  });

  it('still enforces the shared field rules (empty categories rejected)', () => {
    expect(antiParasiteTreatmentFormFieldsSchema.safeParse({ ...validFields, categories: [] }).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () =>
    expectRejectsUnknownKey(antiParasiteTreatmentFormFieldsSchema, validFields));
});