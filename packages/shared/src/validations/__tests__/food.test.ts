import { describe, it, expect } from 'vitest';
import {
  dryFoodSchema,
  wetFoodSchema,
  updateDryFoodSchema,
  updateWetFoodSchema,
  validateDryFoodData,
  validateWetFoodData,
  validateUpdateDryFoodData,
  validateUpdateWetFoodData,
} from '../food';

describe('dryFoodSchema', () => {
  const valid = {
    dailyAmount: '100', // always grams for dry food
    dateStarted: '2026-07-22',
    bagWeight: '2',
    bagWeightUnit: 'kg' as const,
  };

  it('accepts a well-formed entry', () => {
    expect(dryFoodSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing dailyAmount', () => {
    expect(dryFoodSchema.safeParse({ ...valid, dailyAmount: '' }).success).toBe(false);
  });

  it('rejects a non-positive dailyAmount', () => {
    expect(dryFoodSchema.safeParse({ ...valid, dailyAmount: '0' }).success).toBe(false);
  });

  it('rejects missing dateStarted', () => {
    expect(dryFoodSchema.safeParse({ ...valid, dateStarted: '' }).success).toBe(false);
  });

  it('rejects an unparseable dateStarted', () => {
    expect(dryFoodSchema.safeParse({ ...valid, dateStarted: 'not-a-date' }).success).toBe(false);
  });

  // Regression guard: the future-date business rule was intentionally removed
  // from this schema (enforced server-side instead). Format-only from here on.
  it('does NOT reject a future dateStarted', () => {
    expect(dryFoodSchema.safeParse({ ...valid, dateStarted: '2099-01-01' }).success).toBe(true);
  });

  it('rejects missing/non-positive bagWeight', () => {
    expect(dryFoodSchema.safeParse({ ...valid, bagWeight: '' }).success).toBe(false);
    expect(dryFoodSchema.safeParse({ ...valid, bagWeight: '-1' }).success).toBe(false);
  });

  it('rejects an invalid bagWeightUnit', () => {
    expect(dryFoodSchema.safeParse({ ...valid, bagWeightUnit: 'grams' }).success).toBe(false);
  });

  it('rejects dailyAmount equal to or exceeding bag weight (in grams)', () => {
    // bagWeight 1kg = 1000g; dailyAmount is already in grams
    const atLimit = dryFoodSchema.safeParse({ ...valid, bagWeight: '1', dailyAmount: '1000' });
    expect(atLimit.success).toBe(false);
    if (!atLimit.success) {
      expect(atLimit.error.issues[0].path).toEqual(['dailyAmount']);
    }

    const overLimit = dryFoodSchema.safeParse({ ...valid, bagWeight: '1', dailyAmount: '1500' });
    expect(overLimit.success).toBe(false);
  });

  it('accepts dailyAmount comfortably under bag weight when bagWeightUnit is lbs', () => {
    // 2lbs ≈ 907.18g; 500g daily is well under that
    const result = dryFoodSchema.safeParse({ ...valid, bagWeight: '2', bagWeightUnit: 'lbs', dailyAmount: '500' });
    expect(result.success).toBe(true);
  });

  it('rejects dailyAmount exceeding bag weight once converted from lbs to grams', () => {
    // 2lbs ≈ 907.18g; 1000g daily exceeds that
    const result = dryFoodSchema.safeParse({ ...valid, bagWeight: '2', bagWeightUnit: 'lbs', dailyAmount: '1000' });
    expect(result.success).toBe(false);
  });
});

describe('wetFoodSchema', () => {
  const valid = {
    dailyAmount: '100',
    dateStarted: '2026-07-22',
    numberOfUnits: '10',
    weightPerUnit: '85',
    wetFoodUnit: 'grams' as const,
  };

  it('accepts a well-formed entry', () => {
    expect(wetFoodSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a non-integer numberOfUnits', () => {
    expect(wetFoodSchema.safeParse({ ...valid, numberOfUnits: '2.5' }).success).toBe(false);
  });

  it('rejects a non-positive numberOfUnits', () => {
    expect(wetFoodSchema.safeParse({ ...valid, numberOfUnits: '0' }).success).toBe(false);
  });

  it('rejects a non-positive weightPerUnit', () => {
    expect(wetFoodSchema.safeParse({ ...valid, weightPerUnit: '0' }).success).toBe(false);
  });

  it('rejects a non-positive/non-integer numberOfUnits', () => {
    expect(wetFoodSchema.safeParse({ ...valid, numberOfUnits: 'abc' }).success).toBe(false);
  });

  it('rejects an invalid wetFoodUnit', () => {
    expect(wetFoodSchema.safeParse({ ...valid, wetFoodUnit: 'kg' }).success).toBe(false);
  });

  it('rejects dailyAmount equal to or exceeding total weight (same unit)', () => {
    // 10 units * 85g = 850g total; 850g daily is >= total
    const atLimit = wetFoodSchema.safeParse({ ...valid, dailyAmount: '850' });
    expect(atLimit.success).toBe(false);
    if (!atLimit.success) {
      expect(atLimit.error.issues[0].path).toEqual(['dailyAmount']);
    }
  });

  it('accepts dailyAmount under total weight when unit is oz', () => {
    // 2 units * 3oz = 6oz total; 2oz daily is well under that
    const result = wetFoodSchema.safeParse({
      ...valid,
      wetFoodUnit: 'oz',
      numberOfUnits: '2',
      weightPerUnit: '3',
      dailyAmount: '2',
    });
    expect(result.success).toBe(true);
  });

  it('rejects dailyAmount at total weight when unit is oz', () => {
    // 2 units * 3oz = 6oz total; 6oz daily equals total
    const result = wetFoodSchema.safeParse({
      ...valid,
      wetFoodUnit: 'oz',
      numberOfUnits: '2',
      weightPerUnit: '3',
      dailyAmount: '6',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateDryFoodSchema', () => {
  it('accepts an empty object (no-op update)', () => {
    expect(updateDryFoodSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update to dateStarted only', () => {
    expect(updateDryFoodSchema.safeParse({ dateStarted: '2026-06-01' }).success).toBe(true);
  });

  it('does NOT reject a future dateStarted on update either', () => {
    expect(updateDryFoodSchema.safeParse({ dateStarted: '2099-01-01' }).success).toBe(true);
  });

  it('rejects an unparseable dateStarted on update', () => {
    expect(updateDryFoodSchema.safeParse({ dateStarted: 'nope' }).success).toBe(false);
  });

  it('requires bagWeightUnit when bagWeight is being updated', () => {
    const result = updateDryFoodSchema.safeParse({ bagWeight: '3' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['bagWeightUnit']);
    }
  });

  it('accepts bagWeight when bagWeightUnit is also provided', () => {
    expect(updateDryFoodSchema.safeParse({ bagWeight: '3', bagWeightUnit: 'kg' }).success).toBe(true);
  });
});

describe('updateWetFoodSchema', () => {
  it('accepts an empty object (no-op update)', () => {
    expect(updateWetFoodSchema.safeParse({}).success).toBe(true);
  });

  it('requires wetFoodUnit when weightPerUnit is being updated', () => {
    const result = updateWetFoodSchema.safeParse({ weightPerUnit: '90' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['wetFoodUnit']);
    }
  });

  it('requires wetFoodUnit when dailyAmount is being updated', () => {
    const result = updateWetFoodSchema.safeParse({ dailyAmount: '50' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['wetFoodUnit']);
    }
  });

  it('accepts weightPerUnit and dailyAmount together with wetFoodUnit', () => {
    const result = updateWetFoodSchema.safeParse({
      weightPerUnit: '90',
      dailyAmount: '50',
      wetFoodUnit: 'grams',
    });
    expect(result.success).toBe(true);
  });

  it('allows updating numberOfUnits alone without requiring wetFoodUnit', () => {
    // numberOfUnits isn't part of the wetFoodUnit-required guard condition
    expect(updateWetFoodSchema.safeParse({ numberOfUnits: '5' }).success).toBe(true);
  });

  it('rejects a non-integer numberOfUnits on update', () => {
    expect(updateWetFoodSchema.safeParse({ numberOfUnits: '2.5' }).success).toBe(false);
  });
});

describe('throwing validate* helpers', () => {
  it('validateDryFoodData returns parsed data for valid input', () => {
    const data = validateDryFoodData({
      dailyAmount: '100',
      dateStarted: '2026-07-22',
      bagWeight: '2',
      bagWeightUnit: 'kg',
    });
    expect(data.bagWeight).toBe('2');
  });

  it('validateDryFoodData throws with a descriptive message on invalid input', () => {
    expect(() => validateDryFoodData({})).toThrow(/Dry food validation failed/);
  });

  it('validateWetFoodData throws with a descriptive message on invalid input', () => {
    expect(() => validateWetFoodData({})).toThrow(/Wet food validation failed/);
  });

  it('validateUpdateDryFoodData accepts an empty partial update', () => {
    expect(() => validateUpdateDryFoodData({})).not.toThrow();
  });

  it('validateUpdateWetFoodData throws when the cross-field unit rule is violated', () => {
    expect(() => validateUpdateWetFoodData({ dailyAmount: '50' })).toThrow(/Wet food update validation failed/);
  });
});