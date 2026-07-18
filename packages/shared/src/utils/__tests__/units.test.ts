import { describe, it, expect } from 'vitest';
import { convertWeight, formatWeight, convertFoodWeight } from '../units';

describe('convertWeight', () => {
  it('returns the same value when fromUnit equals toUnit', () => {
    expect(convertWeight(5, 'kg', 'kg')).toBe(5);
    expect(convertWeight(5, 'lbs', 'lbs')).toBe(5);
  });

  it('converts kg to lbs', () => {
    expect(convertWeight(1, 'kg', 'lbs')).toBeCloseTo(2.20462, 5);
  });

  it('converts lbs to kg', () => {
    expect(convertWeight(2.20462, 'lbs', 'kg')).toBeCloseTo(1, 5);
  });

  it('round-trips kg -> lbs -> kg within 2 decimal places', () => {
    const original = 5.5;
    const roundTripped = convertWeight(convertWeight(original, 'kg', 'lbs'), 'lbs', 'kg');
    expect(roundTripped).toBeCloseTo(original, 2);
  });
});

describe('formatWeight', () => {
  it('strips trailing zeros after the decimal point', () => {
    expect(formatWeight(4.8)).toBe('4.8');
    expect(formatWeight(43.0)).toBe('43');
  });

  it('keeps meaningful decimals', () => {
    expect(formatWeight(4.85)).toBe('4.85');
  });

  it('handles zero', () => {
    expect(formatWeight(0)).toBe('0');
  });

  it('respects a custom decimals argument', () => {
    expect(formatWeight(4.856, 1)).toBe('4.9');
    expect(formatWeight(4.8, 3)).toBe('4.8');
  });
});

describe('convertFoodWeight', () => {
  it('returns the same value when fromUnit equals toUnit', () => {
    expect(convertFoodWeight(100, 'grams', 'grams')).toBe(100);
  });

  it('converts kg to grams', () => {
    expect(convertFoodWeight(2, 'kg', 'grams')).toBeCloseTo(2000, 5);
  });

  it('converts grams to kg', () => {
    expect(convertFoodWeight(2000, 'grams', 'kg')).toBeCloseTo(2, 5);
  });

  it('converts lbs to grams', () => {
    expect(convertFoodWeight(1, 'lbs', 'grams')).toBeCloseTo(453.592, 3);
  });

  it('converts oz to grams', () => {
    expect(convertFoodWeight(1, 'oz', 'grams')).toBeCloseTo(28.3495, 4);
  });

  it('converts kg to lbs through the grams anchor', () => {
    expect(convertFoodWeight(1, 'kg', 'lbs')).toBeCloseTo(2.20462, 4);
  });

  it('converts oz to lbs through the grams anchor', () => {
    expect(convertFoodWeight(16, 'oz', 'lbs')).toBeCloseTo(1, 2);
  });

  it('round-trips kg -> grams -> kg within 2 decimal places', () => {
    const original = 1.75;
    const roundTripped = convertFoodWeight(
      convertFoodWeight(original, 'kg', 'grams'),
      'grams',
      'kg'
    );
    expect(roundTripped).toBeCloseTo(original, 2);
  });
});