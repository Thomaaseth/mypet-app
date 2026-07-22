import { describe, it, expect } from 'vitest';
import {
  weightEntryFormSchema,
  updateWeightEntrySchema,
  weightTargetSchema,
  createWeightEntrySchema,
  createWeightTargetSchema,
  validateWeightEntry,
} from '../weight';

describe('weightEntryFormSchema', () => {
  const valid = { weight: '4.5', weightUnit: 'kg' as const, date: '2026-07-22' };

  it('accepts a well-formed entry', () => {
    expect(weightEntryFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing weight', () => {
    const result = weightEntryFormSchema.safeParse({ ...valid, weight: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive weight', () => {
    expect(weightEntryFormSchema.safeParse({ ...valid, weight: '0' }).success).toBe(false);
    expect(weightEntryFormSchema.safeParse({ ...valid, weight: '-1' }).success).toBe(false);
  });

  it('rejects a non-numeric weight', () => {
    expect(weightEntryFormSchema.safeParse({ ...valid, weight: 'abc' }).success).toBe(false);
  });

  it('rejects an invalid weightUnit', () => {
    expect(weightEntryFormSchema.safeParse({ ...valid, weightUnit: 'stone' }).success).toBe(false);
  });

  it('rejects a missing date', () => {
    expect(weightEntryFormSchema.safeParse({ ...valid, date: '' }).success).toBe(false);
  });

  // Regression guard: the future-date business rule was intentionally removed
  // from this schema (enforced server-side via getTodayForUser instead).
  // This schema should only ever check format, never "now".
  it('does NOT reject a future date (business rule lives server-side)', () => {
    const farFuture = '2099-01-01';
    expect(weightEntryFormSchema.safeParse({ ...valid, date: farFuture }).success).toBe(true);
  });
});

describe('updateWeightEntrySchema', () => {
  it('accepts a partial update with just the date', () => {
    expect(updateWeightEntrySchema.safeParse({ date: '2026-07-20' }).success).toBe(true);
  });

  it('accepts an empty object (no-op update)', () => {
    expect(updateWeightEntrySchema.safeParse({}).success).toBe(true);
  });

  it('requires weightUnit when weight is being updated', () => {
    const result = updateWeightEntrySchema.safeParse({ weight: '5' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['weightUnit']);
    }
  });

  it('accepts weight when weightUnit is also provided', () => {
    expect(updateWeightEntrySchema.safeParse({ weight: '5', weightUnit: 'kg' }).success).toBe(true);
  });
});

describe('weightTargetSchema', () => {
  const valid = { minWeight: '3', maxWeight: '6', weightUnit: 'kg' as const };

  it('accepts a valid range', () => {
    expect(weightTargetSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when max is not greater than min', () => {
    const result = weightTargetSchema.safeParse({ ...valid, minWeight: '6', maxWeight: '6' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['maxWeight']);
    }
  });

  it('rejects when max is less than min', () => {
    expect(weightTargetSchema.safeParse({ ...valid, minWeight: '10', maxWeight: '5' }).success).toBe(false);
  });

  it('rejects non-positive min/max', () => {
    expect(weightTargetSchema.safeParse({ ...valid, minWeight: '0' }).success).toBe(false);
    expect(weightTargetSchema.safeParse({ ...valid, maxWeight: '-2' }).success).toBe(false);
  });
});

describe('createWeightEntrySchema (animal-specific limits)', () => {
  const base = { weightUnit: 'kg' as const, date: '2026-07-22' };

  it('accepts a cat weight within range (kg)', () => {
    const schema = createWeightEntrySchema('kg', 'cat');
    expect(schema.safeParse({ ...base, weight: '4' }).success).toBe(true);
  });

  it('rejects a cat weight above the cat-specific max (kg)', () => {
    const schema = createWeightEntrySchema('kg', 'cat');
    // 15kg is the cat max; 16kg should fail even though it's well under the 200kg absolute cap
    expect(schema.safeParse({ ...base, weight: '16' }).success).toBe(false);
  });

  it('rejects a cat weight below the cat-specific min (kg)', () => {
    const schema = createWeightEntrySchema('kg', 'cat');
    expect(schema.safeParse({ ...base, weight: '0.01' }).success).toBe(false);
  });

  it('accepts a dog weight within range (kg)', () => {
    const schema = createWeightEntrySchema('kg', 'dog');
    expect(schema.safeParse({ ...base, weight: '30' }).success).toBe(true);
  });

  it('rejects a dog weight above the dog-specific max (kg)', () => {
    const schema = createWeightEntrySchema('kg', 'dog');
    expect(schema.safeParse({ ...base, weight: '95' }).success).toBe(false);
  });

  it('converts lbs to kg before applying animal limits', () => {
    const schema = createWeightEntrySchema('lbs', 'cat');
    // 15kg cat max ≈ 33.07lbs — 35lbs should fail, 30lbs should pass
    expect(schema.safeParse({ ...base, weightUnit: 'lbs', weight: '35' }).success).toBe(false);
    expect(schema.safeParse({ ...base, weightUnit: 'lbs', weight: '30' }).success).toBe(true);
  });

  it('rejects above the absolute 200kg maximum regardless of animal type', () => {
    // Only reachable in practice for dogs given dog max is 90kg, but the
    // absolute cap is a separate branch in the schema and deserves its own test
    const schema = createWeightEntrySchema('kg', 'dog');
    expect(schema.safeParse({ ...base, weight: '250' }).success).toBe(false);
  });
});

describe('createWeightTargetSchema (animal-specific limits)', () => {
  it('accepts a cat target range within limits', () => {
    const schema = createWeightTargetSchema('cat');
    expect(schema.safeParse({ minWeight: '3', maxWeight: '5', weightUnit: 'kg' }).success).toBe(true);
  });

  it('rejects a cat target range exceeding cat max', () => {
    const schema = createWeightTargetSchema('cat');
    expect(schema.safeParse({ minWeight: '3', maxWeight: '20', weightUnit: 'kg' }).success).toBe(false);
  });

  it('accepts a dog target range within limits', () => {
    const schema = createWeightTargetSchema('dog');
    expect(schema.safeParse({ minWeight: '10', maxWeight: '40', weightUnit: 'kg' }).success).toBe(true);
  });
});

describe('validateWeightEntry', () => {
  it('returns success for valid data', () => {
    const result = validateWeightEntry(
      { weight: '4', weightUnit: 'kg', date: '2026-07-22' },
      'kg',
      'cat'
    );
    expect(result.success).toBe(true);
  });

  it('returns failure for data violating animal-specific limits', () => {
    const result = validateWeightEntry(
      { weight: '50', weightUnit: 'kg', date: '2026-07-22' },
      'kg',
      'cat'
    );
    expect(result.success).toBe(false);
  });
});