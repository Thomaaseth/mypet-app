import { describe, it, expect } from 'vitest';
import { getUnitsForSystem } from '../units';

describe('getUnitsForSystem', () => {
  it('returns metric units', () => {
    expect(getUnitsForSystem('metric')).toEqual({
      weightUnit: 'kg',
      bagWeightUnit: 'kg',
      wetFoodUnit: 'grams',
      dryDailyAmountUnit: 'grams',
    });
  });

  it('returns imperial units', () => {
    expect(getUnitsForSystem('imperial')).toEqual({
      weightUnit: 'lbs',
      bagWeightUnit: 'lbs',
      wetFoodUnit: 'oz',
      dryDailyAmountUnit: 'grams',
    });
  });

  it('always keeps dryDailyAmountUnit as grams regardless of system', () => {
    expect(getUnitsForSystem('metric').dryDailyAmountUnit).toBe('grams');
    expect(getUnitsForSystem('imperial').dryDailyAmountUnit).toBe('grams');
  });
});